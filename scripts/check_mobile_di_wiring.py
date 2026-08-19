"""Static check for the mobile-only DI wiring in frontend/app/src/python/finanze/.

That directory hand-maintains its own copy of finanze/server.py's dependency
wiring for the Pyodide/mobile runtime (app_core.py, app_lazy.py,
app_deferred.py, app_background.py). When a use case's __init__ gains a new
required argument, the desktop wiring in server.py is usually updated, but
the mobile copy is easy to forget — and since each tier's use cases are all
constructed together in one function, a single missing-argument TypeError
there aborts construction of every use case in that tier, breaking every
feature that depends on any of them, not just the one that changed.

Run this after changing any use case's constructor signature:

    python3 scripts/check_mobile_di_wiring.py

It's a static, best-effort check (it does not evaluate the code, so it can't
see **kwargs unpacking or dynamically constructed calls) — a clean run is
reassuring, not a guarantee. Exits non-zero if it finds a call site with
fewer arguments than the target class's __init__ has required parameters.
"""

import ast
import subprocess
import sys
from pathlib import Path

REPO = Path(
    subprocess.check_output(
        ["git", "rev-parse", "--show-toplevel"], cwd=Path(__file__).parent
    )
    .decode()
    .strip()
)

MOBILE_WIRING_FILES = [
    REPO / "frontend/app/src/python/finanze" / name
    for name in ("app_core.py", "app_lazy.py", "app_deferred.py", "app_background.py")
]


def collect_class_signatures(py_files):
    """Map class name -> required __init__ parameter names, in declaration order."""
    signatures = {}
    for path in py_files:
        if "__pycache__" in path.parts:
            continue
        try:
            tree = ast.parse(path.read_text(encoding="utf-8"), filename=str(path))
        except (SyntaxError, UnicodeDecodeError):
            continue
        for node in ast.walk(tree):
            if not isinstance(node, ast.ClassDef):
                continue
            for item in node.body:
                if not (isinstance(item, ast.FunctionDef) and item.name == "__init__"):
                    continue
                args = item.args
                positional = [a.arg for a in args.args if a.arg != "self"]
                num_defaults = len(args.defaults)
                required_positional = (
                    positional[: len(positional) - num_defaults]
                    if num_defaults
                    else positional
                )
                required_kwonly = [
                    a.arg for a, d in zip(args.kwonlyargs, args.kw_defaults) if d is None
                ]
                signatures[node.name] = required_positional + required_kwonly
    return signatures


def find_mismatches(class_sigs, wiring_files):
    mismatches = []
    for path in wiring_files:
        if not path.exists():
            continue
        tree = ast.parse(path.read_text(encoding="utf-8"), filename=str(path))
        for node in ast.walk(tree):
            if not (isinstance(node, ast.Call) and isinstance(node.func, ast.Name)):
                continue
            name = node.func.id
            if not (name.endswith("Impl") and name in class_sigs):
                continue
            required = class_sigs[name]
            num_positional = len(node.args)
            kw_names = {kw.arg for kw in node.keywords if kw.arg}
            has_starstar = any(kw.arg is None for kw in node.keywords)
            if has_starstar:
                continue  # can't statically verify **kwargs-unpacked calls
            supplied = num_positional + len(kw_names)
            if supplied < len(required):
                missing = [
                    p for p in required[num_positional:] if p not in kw_names
                ]
                mismatches.append((path, node.lineno, name, required, num_positional, kw_names, missing))
    return mismatches


def main():
    py_files = list((REPO / "finanze").rglob("*.py")) + list(
        (REPO / "frontend/app/src/python").rglob("*.py")
    )
    class_sigs = collect_class_signatures(py_files)
    mismatches = find_mismatches(class_sigs, MOBILE_WIRING_FILES)

    if not mismatches:
        print("OK: no mobile DI wiring mismatches found.")
        return 0

    for path, lineno, name, required, num_positional, kw_names, missing in mismatches:
        rel = path.relative_to(REPO)
        print(f"MISMATCH: {name} in {rel}:{lineno}")
        print(f"  required ({len(required)}): {required}")
        print(f"  supplied: {num_positional} positional + kw={sorted(kw_names)}")
        print(f"  likely missing: {missing}")
        print()
    return 1


if __name__ == "__main__":
    sys.exit(main())
