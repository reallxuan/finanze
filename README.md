<p align="center"><img src="frontend/app/public/finanze-app.png" alt="Finanze logo — self-hosted personal finance and net worth tracker" width="220px"></p>
<h1 align="center">Finanze (personal fork)</h1>

> **This is a personal fork of [finanze/finanze](https://github.com/finanze/finanze), and it has diverged significantly from the upstream project.**
>
> Most notably, this fork **removed all automated bank/broker/crypto-exchange login and scraping** (PSD2, Enable Banking, GoCardless, entity credential login, background data fetching) in favor of a **manual-entities-only** workflow — see [`c0e2108`](../../commit/c0e2108) "simplify app to manual institutions and positions". It also changes the default currency to **HKD** and adds **Chinese localization**. Anything in the upstream README about connecting real financial entities, 2FA, or automated syncing **does not apply here**.
>
> The links, badges, and download channels from the original project (official releases, Uptodown, TestFlight, App Store, Docker Hub images) point to the **upstream** project, not this fork — this fork is not published anywhere; build it yourself from source (see [Development](#development)).

<p align="center">
A private, self-hosted personal finance and net worth tracker. You manually create institutions/entities and their positions (accounts, stocks, funds, real estate, commodities, crypto...), and the app tracks value, multicurrency conversion, earnings/expenses, and forecasts over time. Everything is stored in a local encrypted database.
</p>

## Table of Contents

- [Features](#features)
- [Development](#development)
- [Credits](#credits)

## Features

- 🏦 Manually defined institutions/entities, each holding one or more positions
- 💼 Supported position types: accounts, cards, deposits, funds, stocks/ETFs, portfolios, loans/mortgages, real estate, commodities, crypto
- 🏠 Real estate investments with a variety of metrics and KPIs
- 🪙 Commodities with market value tracking (gold, silver, platinum, palladium)
- 💵 Earnings and expenses tracking with periodic contributions to forecast future positions
- 💱 Multicurrency support with automatic exchange rate fetching (HKD default)
- 🔐 Local encrypted database for secure data storage
- 📤 Dynamic and customizable data export to Google Sheets or CSV/TSV/Excel files
- 📥 Manual data importing, highly configurable via templates
- 📊 Savings & retirement calculator with multiple scenarios and variables
- 📱 Desktop (Electron), Android and iOS (Capacitor + Pyodide-based local Python backend on mobile)
- 🌐 Localized UI, including Chinese

### Crypto

Crypto is tracked as manually entered positions rather than live wallet balances. Chain/address-based wallet monitoring (BTC, ETH, LTC, TRON, BSC — read-only, no login) is planned but not yet implemented; see [FUTURE.md](FUTURE.md).

### Export and Importing

This project allows creating specific tables in different formats, aggregating and formatting your manually entered data. Two modalities are supported:

- **Google Sheets**: supported for exporting and importing, which requires setting up a Google Service Account. When importing, the spreadsheet data is treated as a source of truth for that import — each import overrides previous data from Google Sheets (does not affect manually provided data).
- **Files**: CSV, TSV and Excel files are supported for exporting and importing, no special setup needed.

#### Templating

Exporting and importing is highly customizable using templates, which define table structure, data formatting, filters and other options. Templates are required for importing.

## Development

This project requires `Python 3.14`.
For the frontend use `pnpm`, and `node 24`.

### Setup

1. Clone the repository (this fork):

    ```sh
    git clone <this repo's URL>
    cd finanze
    ```

2. Create a virtual environment and activate it (recommended Pyenv for version management):

    ```sh
    python3 -m venv venv
    source venv/bin/activate
    ```

3. Install the required dependencies:

    ```sh
    pip install -r requirements.txt -r requirements-dev.txt -r requirements-lint.txt -r requirements-packaging.txt
    pre-commit install
    ```

4. Setup frontend:

    ```sh
    cd frontend/app
    pnpm install
                         # ---- Mobile SPECIFIC ----
    pnpm install:pyodide # For mobile app initial setup, it will download Pyodide and all required Python dependencies for mobile backend
    ```

5. Run it

    ```sh
    python ./finanze/finanze --port 7592 --data-dir .storage --log-dir .storage/logs --log-level DEBUG --third-party-log-level DEBUG

    cd frontend/app
    pnpm dev            # For electron desktop app

                        # ---- Mobile SPECIFIC ----
    pnpm dev:mobile     # For mobile app (web feature limited, but useful for basic development and testing)
    pnpm cap:ios        # For iOS development (requires Xcode and Mac)
    pnpm cap:android    # For Android development (requires Android Studio and related SDKs)
    pnpm cap:sync       # To sync changes to native projects after frontend development
    ```

#### Building an Android APK

See [CLAUDE.md](CLAUDE.md) for the full mobile build steps, the Android `versionCode` convention, and known build pitfalls (missing `install:pyodide`, git-worktree path issues).

#### Other

##### Formatting

    ```sh
    ruff format

    cd frontend/app
    pnpm format
    ```

##### Executing tests

    ```sh
    pytest              # Backend

    cd frontend/app
    pnpm test           # Frontend

    cd e2e/standard
    pnpm test           # Web based E2E

    cd e2e/mobile
    pnpm local:both     # Mobile based basic E2E
    ```

### Environment Variables

Checkout example [docker-compose.yml](docker-compose.yml) for the environment variables that can be used to override the default config, most important ones are:

- `USERNAME` and `PASSWORD` optional, to auto start session on load.
- `MULTI_USER` optional, to allow multiple user sign up (only recommended for local development).

### Docker

`docker-compose.yml` references the upstream `finanze/finanze` Docker Hub images by default — those do **not** contain this fork's changes. Build your own images from this repo's `Dockerfile` / `frontend/app/Dockerfile` instead of pulling the upstream tags.

## Credits

This project is a fork of [finanze/finanze](https://github.com/finanze/finanze).

- Powered by [CoinGecko](https://www.coingecko.com/).
- Powered by [CoinMarketCap](https://coinmarketcap.com/).
- Powered by [CryptoCompare](https://www.cryptocompare.com/).
- [Pyodide](https://github.com/pyodide/pyodide) is used for mobile backend compatibility.
