"""Static check for the hand-maintained copies of finanze/server.py's DI wiring.

finanze/server.py is the canonical place where use cases are constructed, but
it is not the only one. Two other places re-declare the same wiring by hand:

  * frontend/app/src/python/finanze/{app_core,app_lazy,app_deferred,
    app_background}.py — the Pyodide/mobile runtime, which cannot import
    server.py and so keeps its own tiered copy.
  * tests/integration/controller/conftest.py — the integration-test fixture,
    which builds the same graph against in-memory/temporary adapters.

None of these are kept in sync automatically. When a use case's __init__ gains
a new required argument, server.py is usually updated and the copies are
forgotten. The failure mode is disproportionate: the mobile tiers construct
every use case of a tier in a single function, so one missing-argument
TypeError aborts the whole tier and breaks every feature behind it; the test
fixture likewise builds the whole app, so one bad call site errors out the
entire integration suite.

Run this after changing any use case's constructor signature:

    python3 scripts/check_di_wiring.py

It's a static, best-effort check (it does not evaluate the code, so it can't
see **kwargs unpacking, dynamically constructed calls, or classes whose name
is defined in more than one place with differing signatures) — a clean run is
reassuring, not a guarantee. Exits non-zero if any call site disagrees with
the target class's __init__.
"""

import ast
import subprocess
import sys
import warnings
from pathlib import Path
from typing import NamedTuple

REPO = Path(
    subprocess.check_output(
        ["git", "rev-parse", "--show-toplevel"], cwd=Path(__file__).parent
    )
    .decode()
    .strip()
)

WIRING_FILES = [
    REPO / "frontend/app/src/python/finanze" / name
    for name in ("app_core.py", "app_lazy.py", "app_deferred.py", "app_background.py")
] + [REPO / "tests/integration/controller/conftest.py"]


def _parse(path: Path) -> ast.AST:
    """Parse a file, muting SyntaxWarnings this tool has no business reporting."""
    with warnings.catch_warnings():
        warnings.simplefilter("ignore", SyntaxWarning)
        return ast.parse(path.read_text(encoding="utf-8"), filename=str(path))


class Signature(NamedTuple):
    positional: list  # every positional-or-keyword param, in declaration order
    required: list  # those without a default
    kwonly: list
    required_kwonly: list
    has_star_args: bool
    has_star_kwargs: bool


class Mismatch(NamedTuple):
    path: Path
    lineno: int
    name: str
    problem: str
    detail: str


# Sentinel for a class name declared in more than one module with different
# signatures: we can't tell which one a call site means, so we skip it.
AMBIGUOUS = object()


def _signature(init: ast.FunctionDef) -> Signature:
    args = init.args
    positional = [a.arg for a in args.args if a.arg != "self"]
    num_defaults = len(args.defaults)
    required = (
        positional[: len(positional) - num_defaults]
        if num_defaults
        else list(positional)
    )
    return Signature(
        positional=positional,
        required=required,
        kwonly=[a.arg for a in args.kwonlyargs],
        required_kwonly=[
            a.arg for a, d in zip(args.kwonlyargs, args.kw_defaults) if d is None
        ],
        has_star_args=args.vararg is not None,
        has_star_kwargs=args.kwarg is not None,
    )


def collect_class_signatures(py_files):
    """Map class name -> Signature of its __init__ (or AMBIGUOUS if it clashes)."""
    signatures = {}
    for path in py_files:
        if "__pycache__" in path.parts:
            continue
        try:
            tree = _parse(path)
        except (SyntaxError, UnicodeDecodeError):
            continue
        for node in ast.walk(tree):
            if not isinstance(node, ast.ClassDef):
                continue
            for item in node.body:
                if not (isinstance(item, ast.FunctionDef) and item.name == "__init__"):
                    continue
                sig = _signature(item)
                previous = signatures.get(node.name)
                if previous is None:
                    signatures[node.name] = sig
                elif previous is not AMBIGUOUS and previous != sig:
                    signatures[node.name] = AMBIGUOUS
    return signatures


def check_call(path, node, sig):
    """Report every way this call site disagrees with the constructor."""
    if any(kw.arg is None for kw in node.keywords):
        return []  # **kwargs-unpacked: can't statically verify

    num_positional = len(node.args)
    kw_names = [kw.arg for kw in node.keywords]
    problems = []

    def add(problem, detail):
        problems.append(Mismatch(path, node.lineno, node.func.id, problem, detail))

    missing = [p for p in sig.required[num_positional:] if p not in kw_names] + [
        p for p in sig.required_kwonly if p not in kw_names
    ]
    if missing:
        add(
            "missing required argument(s)",
            f"{missing} — supplied {num_positional} positional + {sorted(kw_names)}, "
            f"constructor requires {sig.required + sig.required_kwonly}",
        )

    if num_positional > len(sig.positional) and not sig.has_star_args:
        add(
            "too many positional arguments",
            f"{num_positional} given, constructor takes {len(sig.positional)}: "
            f"{sig.positional}",
        )

    if not sig.has_star_kwargs:
        known = set(sig.positional) | set(sig.kwonly)
        unknown = [k for k in kw_names if k not in known]
        if unknown:
            add(
                "unknown keyword argument(s)",
                f"{unknown} — constructor accepts {sig.positional + sig.kwonly} "
                "(a renamed parameter looks like this)",
            )

    duplicated = [k for k in kw_names if k in sig.positional[:num_positional]]
    if duplicated:
        add(
            "argument passed both positionally and by keyword",
            f"{duplicated}",
        )

    return problems


def find_mismatches(class_sigs, wiring_files):
    mismatches = []
    for path in wiring_files:
        if not path.exists():
            print(f"WARNING: wiring file not found, skipping: {path}", file=sys.stderr)
            continue
        tree = _parse(path)
        for node in ast.walk(tree):
            if not (isinstance(node, ast.Call) and isinstance(node.func, ast.Name)):
                continue
            sig = class_sigs.get(node.func.id)
            if sig is None or sig is AMBIGUOUS:
                continue  # not a class we can resolve, or name defined twice
            mismatches.extend(check_call(path, node, sig))
    return mismatches


def main():
    py_files = list((REPO / "finanze").rglob("*.py")) + list(
        (REPO / "frontend/app/src/python").rglob("*.py")
    )
    class_sigs = collect_class_signatures(py_files)
    mismatches = find_mismatches(class_sigs, WIRING_FILES)

    if not mismatches:
        print(f"OK: no DI wiring mismatches found in {len(WIRING_FILES)} wiring files.")
        return 0

    for m in mismatches:
        print(f"MISMATCH: {m.name} in {m.path.relative_to(REPO)}:{m.lineno}")
        print(f"  {m.problem}: {m.detail}")
        print()
    print(f"{len(mismatches)} mismatch(es) found.")
    return 1


if __name__ == "__main__":
    sys.exit(main())
