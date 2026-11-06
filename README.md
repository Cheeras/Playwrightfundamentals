# 🎭 Playwright Fundamentals

A hands-on project for learning and practicing **Playwright** — Microsoft's end-to-end testing framework for modern web applications.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Configuration](#configuration)
- [Writing Tests](#writing-tests)
- [Running Tests](#running-tests)
- [Viewing Reports](#viewing-reports)
- [Notes & Learning Resources](#notes--learning-resources)
- [GitHub Pages Report](#github-pages-report)

---

## Overview

This project demonstrates how to automate browser interactions using **Playwright** with **TypeScript**. It covers:

- **Playwright Engine** (`playwright-core`) — The low-level browser automation layer that launches browsers, controls pages, and executes actions like `click()`, `fill()`, `goto()`, etc.
- **Playwright Test Runner** (`@playwright/test`) — The test framework built on top of the engine that provides `test()`, `expect()`, fixtures, reporters, parallel execution, retries, and configuration management.

> 📘 See [Notes/playwrightenginevsTestrunner.md](Notes/playwrightenginevsTestrunner.md) for a detailed breakdown of how the Engine and Test Runner differ and how they connect.

---

## Tech Stack

| Technology | Version | Purpose |
|---|---|---|
| **Node.js** | ≥ 20 | Runtime |
| **Playwright** | ^1.64.1 | Browser automation library |
| **@playwright/test** | ^1.64.1 | Test runner & fixtures |
| **TypeScript** | (via Playwright) | Type-safe test authoring |

---

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/Cheeras/Playwrightfundamentals.git
cd Playwrightfundamentals
```

### 2. Install dependencies

```bash
npm install
```

### 3. Install browsers

```bash
npx playwright install
```

> Installs Chromium, Firefox, and WebKit browser binaries into `%USERPROFILE%\AppData\Local\ms-playwright\`.

### 4. Run tests

```bash
npx playwright test
```

---

## Project Structure

```
D:\Workspace\Playwrightfundamentals\
│
├── tests/
│   ├── example.spec.ts              ← Sample tests from Playwright getting-started
│   ├── tta-check.spec.ts            ← Login test for The Testing Academy app
│   ├── normal_pw.ts                 ← Plain TS script using Playwright Engine directly (no test runner)
│   └── multiple_context.ts          ← Demo of multiple browser contexts (admin + viewer)
│
├── Notes/
│   └── playwrightenginevsTestrunner.md  ← Deep dive: Engine vs Test Runner
│
├── playwright.config.ts             ← Playwright test configuration
│
├── node_modules/
│   ├── @playwright/test/            ← TEST RUNNER (public API)
│   │   ├── cli.js
│   │   ├── index.js                 ← module.exports = require('playwright/test')
│   │   └── package.json
│   │
│   ├── playwright/                  ← WRAPPER (bridges runner + engine)
│   │   ├── index.js                 → points to playwright-core
│   │   ├── test.js                  → combines engine + runner
│   │   ├── lib/
│   │   │   ├── runner/              ← Test orchestration
│   │   │   ├── worker/              ← Worker processes
│   │   │   ├── cli/                 ← CLI commands
│   │   │   ├── common/              ← Config, fixtures
│   │   │   ├── matchers/            ← expect() assertions
│   │   │   ├── loader/              ← Test file loading
│   │   │   └── transform/           ← TypeScript transpilation
│   │   └── package.json
│   │
│   └── playwright-core/             ← ENGINE (browser automation)
│       ├── index.js                 → loads lib/coreBundle.js
│       └── lib/
│           ├── coreBundle.js        ← 🔴 THE ENGINE (78K lines)
│           └── server/
│               └── chromium/        ← Browser process management
│
├── playwright-report/               ← HTML test report
├── test-results/                    ← Traces, screenshots on failure
├── sdet.png                         ← Project branding
├── package.json
├── package-lock.json
└── README.md
```

---

## Configuration

Key settings in [playwright.config.ts](playwright.config.ts):

| Setting | Value | Description |
|---|---|---|
| `testDir` | `./tests` | Where test files are located |
| `fullyParallel` | `true` | Run all tests in parallel |
| `retries` | `2` (CI only) | Retry failed tests on CI |
| `reporter` | `html` | Generate HTML report |
| `headless` | `false` | Run with visible browser window |
| `trace` | `on-first-retry` | Capture trace on first retry |
| `projects` | `chromium` with Chrome channel | Chrome browser via installed Google Chrome |

Other browsers (Firefox, WebKit, Mobile, Edge) are commented out and can be enabled as needed.

---

## Writing Tests

Tests use the Playwright Test Runner API:

```typescript
import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('https://playwright.dev/');
  await expect(page).toHaveTitle(/Playwright/);
});
```

### Available fixtures

- `page` — Isolated browser page per test
- `context` — Isolated browser context per test
- `browser` — Shared browser instance
- `request` — API request context

> The `page` fixture is provided by the **Test Runner** (`@playwright/test`), while methods like `page.goto()`, `page.click()`, and `page.fill()` are implemented by the **Engine** (`playwright-core`).

---

## Running Tests

```bash
# Run all tests
npx playwright test

# Run a specific test file
npx playwright test tests/example.spec.ts

# Run tests with UI mode (interactive)
npx playwright test --ui

# Run tests in headed mode (visible browser)
npx playwright test --headed

# Run tests in debug mode
npx playwright test --debug
```

## Running Plain TypeScript Scripts

Files like `tests/normal_pw.ts` and `tests/multiple_context.ts` use the **Playwright Engine directly** (not the Test Runner). Run them with `tsx`:

```bash
npx tsx tests/normal_pw.ts
npx tsx tests/multiple_context.ts
```

> `tsx` compiles and runs TypeScript in one step without creating `.js` files. It's the recommended way to run standalone Playwright scripts.

---

## Viewing Reports

```bash
# Open the HTML report locally
npx playwright show-report
```

If port 9323 is already in use, specify a different port:

```bash
npx playwright show-report --port=9324
```

The report is also auto-published to **GitHub Pages** on push:

> **🔗 View live report:** [https://Cheeras.github.io/Playwrightfundamentals/](https://Cheeras.github.io/Playwrightfundamentals/)

---

## Notes & Learning Resources

- [playwrightenginevsTestrunner.md](Notes/playwrightenginevsTestrunner.md) — Detailed explanation of the Playwright Engine (`playwright-core`) vs the Test Runner (`@playwright/test`), including folder locations, dependency chain, runtime flow diagram, and how they connect.

### Key Concepts Covered

- ✅ Asynchronous operations and `await` in Playwright
- ✅ Page navigation lifecycle (`goto`, `waitUntil`)
- ✅ Locators and auto-waiting
- ✅ Test fixtures (`page`, `context`, `browser`)
- ✅ HTML reporting and trace viewer
- ✅ Playwright Engine vs Test Runner architecture
- ✅ Standalone Playwright scripts (Engine-only, no Test Runner)
- ✅ Multiple browser contexts for multi-user scenarios

---

## GitHub Pages Report

The HTML test report is deployed to GitHub Pages automatically on each push. The report includes:

- ✅ Pass/fail summary
- ✅ Test duration
- ✅ Error messages and stack traces
- ✅ Trace viewer links for failed tests
- ✅ Screenshots and video (if configured)

---

## 📝 License

This project is for educational purposes.