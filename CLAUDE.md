# CLAUDE.md

## Project context

This repo is a personal fork of [finanze/finanze](https://github.com/finanze/finanze) that has diverged significantly from upstream — see the notice at the top of [README.md](README.md). Key differences: all automated bank/broker/crypto-exchange login and scraping was removed in favor of manual-entities-only (commit `c0e2108`), default currency is HKD, and Chinese localization was added. Don't assume upstream docs, issues, or entity-integration behavior still apply here.

## Git workflow

- `main` is the stable/release branch. `develop` is the integration branch and **may be force-pushed** — it's expected to be unstable, don't treat its history as durable.
- All feature/fix work happens on a `feat/xxx` branch, branched **from `main`** (not from `develop`).
- Every merge into `develop` or `main` — no exceptions — must be a **non-fast-forward merge** (`git merge --no-ff`, or the "Create a merge commit" option on GitHub, not "Squash and merge" or "Rebase and merge"). This keeps each feature's history as a distinguishable merge bubble instead of flattening everything into a linear log.

## Do not do interactive browser/UI testing

**Never drive the app yourself through a browser or emulator to verify a fix** (clicking through forms, taking screenshots to "confirm" behavior, etc.). The user does this testing themselves. When a fix needs live verification: start the relevant dev server(s) (see below) and hand the user the URL — don't click through the UI first "just to check." Static verification (typecheck, lint, reading the code path, matching an existing proven pattern elsewhere in the codebase) is fine and expected; driving the UI is not.

To start a browser-testable (non-Electron) web frontend against a local backend:

```bash
# from repo root, with a venv that has requirements.txt installed
./venv/bin/python ./finanze --port <port> --data-dir .storage --log-dir .storage/logs --log-level DEBUG --third-party-log-level DEBUG

# from frontend/app, in a separate terminal — --mode mobile skips the Electron plugin
# so `pnpm dev`/`vite --host` doesn't try to launch a desktop Electron window
VITE_BASE_URL=http://localhost:<port> pnpm exec vite --host --port <other-port> --mode mobile
```

Check `lsof -i :<port>` first — other sessions/worktrees may already have a backend running on the default 7592; use a different port rather than fighting over one, and don't kill a process you didn't start without checking whose it is first.

## Building an Android debug APK

From `frontend/app`, in order:

```bash
pnpm install
pnpm run install:pyodide   # one-time: downloads Pyodide runtime + wheels into dist-pyodide/
pnpm run build:mobile
FINANZE_PYTHON_MINIFY=0 node scripts/bundle-python.js   # only needed if python-minifier isn't installed locally; skips minification, output still works, just larger
pnpm exec cap sync android
cd android && JAVA_HOME=$(/usr/libexec/java_home) ./gradlew assembleDebug --no-daemon
```

Output: `frontend/app/android/app/build/outputs/apk/debug/app-debug.apk`

Also requires `frontend/app/android/local.properties` with `sdk.dir=<path to Android SDK>` (gitignored, create if missing).

**Do not skip `install:pyodide` before the first mobile build.** Without it, `dist/pyodide/` has no runtime files, the app installs fine but hangs on a spinner forever at launch (Pyodide fails to fetch `pyodide.asm.mjs`, so the local Python backend never starts).

## Android versionCode convention

`versionCode` in `frontend/app/android/app/build.gradle` is `minor*100 + patch` (major is dropped, assumed 0). E.g. `0.9.2` → `902`, `0.10.1` → `1001`, `0.10.2` → `1002`. Get this right — Android refuses to install an APK with a `versionCode` lower than what's already on the device, even if the human-readable `versionName` looks higher (e.g. `0.11.0` felt "bigger" than `0.10.1` but its naive versionCode `110` was actually less than `1001`).

When bumping the version, update in lockstep: `frontend/app/package.json`, `pyproject.toml`, `finanze/version.py`, `frontend/app/android/app/build.gradle` (`versionCode` + `versionName`), `frontend/app/ios/App/App.xcodeproj/project.pbxproj` (`MARKETING_VERSION = {version}00;`), and `.bumpversion.toml`.

## DI wiring drifts from `server.py` — check it after any use case constructor change

`finanze/server.py` is the canonical dependency wiring, but **two other places re-declare it by hand** and nothing keeps them in sync:

- `frontend/app/src/python/finanze/{app_core,app_lazy,app_deferred,app_background}.py` — the Pyodide/mobile runtime, which can't import `server.py` and keeps its own tiered copy.
- `tests/integration/controller/conftest.py` — the integration-test fixture, which builds the same graph against temporary adapters.

Updating one does not update the others. The same missing-argument bug has now shown up in all three.

This bit us for real, twice, from one change: the accounting refactor added a new required `adjust_account_balance` argument to `AddManualTransactionImpl`, `UpdateManualTransactionImpl`, and `DeleteManualTransactionImpl` and updated `server.py` to match, but touched neither `app_lazy.py` nor the test fixture.

The blast radius was far bigger than those three features in both copies, because each builds its whole graph in one function:

- **Mobile** — each tier's use cases (core/lazy/deferred/background) are constructed together (e.g. `LazyComponents.__init__`), so the first missing-argument `TypeError` aborted the *entire tier*, breaking every feature backed by any lazy-tier use case. Symptom on device: the app opens fine, but literally every action that touches the database fails — indistinguishable from "the database is corrupted" until the traceback was captured (`AddManualTransactionImpl.__init__() missing 1 required positional argument: 'adjust_account_balance'`) via `adb logcat` on an emulator.
- **Tests** — the fixture builds the whole app, so the one bad call site turned into 386 collection errors across the integration suite.

**After changing any use case's `__init__` signature, run:**

```bash
python3 scripts/check_di_wiring.py
```

It statically compares every constructor call in all five wiring files against that class's actual `__init__` signature, flagging missing required arguments, unknown keywords (what a renamed parameter looks like), too many positional arguments, and arguments passed both ways. It's best-effort (can't see `**kwargs`-unpacked or dynamically constructed calls, and skips class names defined twice with different signatures), but a clean run is a strong signal; a flagged mismatch is a real bug. This won't catch everything a full mobile boot-and-click test would, but it catches exactly this class of bug in seconds instead of requiring a build + install + emulator repro.

## Worktree gotcha in `scripts/bundle-python.js`

`SOURCE_ROOT` resolves via `git rev-parse --show-toplevel` (not a hardcoded `../../../../finanze/finanze` relative path) specifically because that fixed-depth path only worked for the plain checkout at `/Users/zepher/xuan/finanze`. Under a git worktree (`.claude/worktrees/<name>/frontend/app/...`), the extra nesting broke it — it silently resolved to a nonexistent sibling path, so the copy silently no-opped for the main `finanze/` package (only the small `src/python/` mobile overlay got bundled). Symptom: the built app installs and the Pyodide runtime loads, but Python raises `ModuleNotFoundError: No module named 'application'` (or `'domain'`) and the app never gets past its loading state. If this regresses, verify `dist/python/finanze/application` exists and is non-trivial after building.
