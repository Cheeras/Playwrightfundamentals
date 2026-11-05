# Playwright Engine vs Playwright Test Runner

> **Project context:** `playwrightfundamentals` using Playwright v1.64.1
> **Packages installed:** `@playwright/test@^1.64.1`, `playwright@1.64.1` (via dependency), `playwright-core@1.64.1` (via dependency)

---

## 1. Overview — What each one is

| Concept | What it does |
|---|---|
| **Playwright Engine** (`playwright-core`) | The low-level browser automation engine. It launches browsers, controls pages, clicks elements, fills forms, takes screenshots — the actual "doing stuff in the browser" part. |
| **Playwright Test Runner** (`@playwright/test`) | The test framework built on top of the engine. It provides `test()`, `expect()`, fixtures, reporting, parallelization, retries, config handling — the "organizing and running tests" part. |

---

## 2. Where each one lives in your project

### Dependency chain

```
@playwright/test  (devDependency in package.json)
    ↓ depends on
playwright        (installed automatically)
    ↓ depends on
playwright-core   (installed automatically)
```

### Playwright Engine — Location in `node_modules`

```
node_modules/
└── playwright-core/                       ← THE ENGINE PACKAGE
    ├── package.json                       → "name": "playwright-core", v1.64.1
    ├── index.js                           → Entry: module.exports = require('./lib/coreBundle')
    ├── lib/
    │   ├── coreBundle.js                  ← 🔴 THE CORE ENGINE (BUNDLED)
    │   │                                     Contains: page.goto(), click(), fill(),
    │   │                                     browser.launch(), page.screenshot(), etc.
    │   │                                     (78,042 lines — single bundled file)
    │   ├── server/                        ← Browser process management
    │   │   ├── chromium/                  → Chromium browser controller
    │   │   └── electron/                  → Electron app controller
    │   ├── bootstrap.js                   → Bootstrap/initialization logic
    │   ├── serverRegistry.js              → Browser download/registry logic
    │   └── utilsBundle.js                 → Bundled utility libraries
    ├── bin/                               → Downloads for browser binaries
    └── browsers.json                      → Maps Playwright version → browser versions
```

**What the Engine does (all inside `coreBundle.js`):**
- Launches browser processes (Chromium, Firefox, WebKit)
- Communicates with browsers via WebSocket protocol
- Implements `page.goto()`, `locator.click()`, `page.fill()`, `page.screenshot()`, etc.
- Handles network interception, auto-waiting, element locators
- Manages browser contexts, pages, frames, workers

### Playwright Test Runner — Location in `node_modules`

```
node_modules/
├── @playwright/test/                     ← THE TEST RUNNER PACKAGE (your devDependency)
│   ├── package.json                      → "name": "@playwright/test", v1.64.1
│   ├── index.js                          → module.exports = require('playwright/test')
│   ├── cli.js                            → The `playwright` CLI binary
│   ├── reporter.js                       → Reporter API exports
│   └── ...
│
└── playwright/                           ← WRAPPER PACKAGE (bridges test runner + engine)
    ├── package.json                      → "name": "playwright", v1.64.1
    ├── index.js                          → Entry: require('playwright-core') — exports engine API
    ├── test.js                           → Combines engine + test runner exports
    ├── lib/
    │   ├── runner/                       → Test runner core
    │   │   └── index.js                  → Test orchestration logic
    │   ├── worker/                       → Test worker process logic
    │   ├── cli/                          → CLI command implementations
    │   ├── common/                       → Shared helpers (config, fixtures, etc.)
    │   ├── program.js                    → CLI program entry point
    │   ├── loader/                       → Test file loading/transformation
    │   ├── transform/                    → Babel/TypeScript transpilation
    │   ├── matchers/                     → expect() matchers (toEqual, toHaveText, etc.)
    │   ├── isomorphic.js                 → Code shared between worker and main process
    │   └── globals.js                    → Global test hooks setup
    └── index.d.ts / index.mjs            → TypeScript / ESM entry points
```

**What the Test Runner does (all inside `playwright/lib/`):**
- Provides `test()`, `test.describe()`, `test.beforeEach()`, etc.
- Provides `expect()` with Playwright-specific matchers
- Runs `playwright.config.ts` — reads configuration
- Manages test workers (parallel execution)
- Handles retries, sharding, timeouts
- Generates HTML/JSON reports
- Provides `npx playwright test` CLI
- Provides `npx playwright show-report` command

---

## 3. How they connect — the runtime flow

When you run `npx playwright test`, here's what happens:

```
Terminal: npx playwright test
    │
    ▼
@playwright/test/cli.js                    ← CLI binary entry
    │  require('playwright')
    ▼
playwright/lib/program.js                  ← CLI program logic
    │
    ▼
playwright/lib/runner/index.js             ← Test runner orchestrates everything
    │
    ├── Reads playwright.config.ts
    ├── Spawns worker processes
    │
    ▼
Worker process loads your test file (example.spec.ts):
    │
    ├── import { test, expect } from '@playwright/test'
    │       └── resolves to → playwright/lib/index.js (fixture/test API)
    │
    ├── import { chromium } from '@playwright/test'
    │       └── resolves to → playwright-core/index.js → coreBundle.js
    │
    ▼
Your test calls:  await page.goto('https://playwright.dev/')
    │
    ▼
playwright-core/lib/coreBundle.js          ← ENGINE handles it
    │  Sends "navigate" command via WebSocket
    ▼
Browser process (chrome.exe)               ← Separate OS process
    │  Loads the page, fires events back
    ▼
Engine resolves the Promise → your test continues
```

---

## 4. Runtime Flow Diagram

```
┌──────────────────────────────────────────┐
│  Your test:  await page.goto('...')       │
│       ↓                                   │
│  playwright/lib/runner/  —  Test runner   │
│  (orchestrates the test execution)        │
│       ↓                                   │
│  playwright-core/lib/coreBundle.js        │ ← The "engine"
│  ┌────────────────────────────────────┐   │
│  │ Contains: page.goto() logic        │   │
│  │ Sends WebSocket commands to browser│   │
│  │ Processes events from browser      │   │
│  └──────────┬─────────────────────────┘   │
│             │ WebSocket                   │
│             ▼                             │
│  Browser process (chrome.exe)             │
│  (located in %USERPROFILE%\AppData\...)   │
└──────────────────────────────────────────┘
```

**What happens at each layer:**

| Layer | Role | Example file in your project |
|---|---|---|
| **Your test** | Calls `page.goto()` using fixture from Test Runner | `tests/example.spec.ts` |
| **Test Runner** | Provides the `page` fixture, manages test lifecycle | `node_modules/playwright/lib/runner/` |
| **Engine** (`coreBundle.js`) | Receives `goto()` call, sends WebSocket command to browser, waits for page load, returns Response | `node_modules/playwright-core/lib/coreBundle.js` |
| **Browser process** | Actual Chrome/Edge/Firefox process running the URL, parsing HTML, executing JS | `%USERPROFILE%\AppData\Local\ms-playwright\chromium-XXXX\chrome.exe` |

---

## 5. Visual folder map in your project

```
D:\Workspace\Playwrightfundamentals\
│
├── node_modules\
│   │
│   ├── @playwright\test\                   ◄── TEST RUNNER (public API)
│   │   ├── cli.js           (npx playwright)
│   │   ├── index.js         (require('@playwright/test'))
│   │   └── package.json
│   │
│   ├── playwright\                         ◄── WRAPPER (bridges both)
│   │   ├── index.js         (engine API)       → points to playwright-core
│   │   ├── test.js          (runner API)       → combines engine + runner
│   │   ├── lib\runner\      (test execution)   ← Runner core
│   │   ├── lib\worker\      (worker processes) ← Runner workers
│   │   ├── lib\cli\         (CLI commands)     ← Runner CLI
│   │   ├── lib\common\      (shared config)    ← Runner utilities
│   │   ├── lib\matchers\    (expect())         ← Runner assertions
│   │   └── package.json
│   │
│   └── playwright-core\                     ◄── ENGINE (browser automation)
│       ├── index.js         (entry)            → loads coreBundle.js
│       ├── lib\coreBundle.js (THE ENGINE)      ◄── page.goto(), click(), etc.
│       ├── lib\server\      (browser control)  ← Browser process management
│       └── browsers.json    (browser versions) ← Which browsers to download
│
├── tests\example.spec.ts                    ◄── YOUR TEST FILE
├── playwright.config.ts                     ◄── TEST RUNNER CONFIG
└── playwright-report\                       ◄── HTML REPORT OUTPUT
```

---

## 6. Key takeaways

| Aspect | Playwright Engine (`playwright-core`) | Playwright Test Runner (`@playwright/test`) |
|---|---|---|
| **Package** | `playwright-core` | `@playwright/test` |
| **What you install** | Automatic dependency | Explicit `devDependency` |
| **Main file** | `node_modules/playwright-core/lib/coreBundle.js` | `node_modules/playwright/lib/runner/index.js` |
| **Purpose** | Launch browsers, control pages, automate actions | Define, organize, and run tests |
| **Exports** | `chromium`, `firefox`, `webkit`, `Browser`, `Page`, etc. | `test`, `expect`, `test.describe`, fixtures, reporters |
| **Who calls it** | Your test code via `page.goto()` etc. | You via `npx playwright test` |
| **Where code lives** | `node_modules/playwright-core/` | `node_modules/playwright/lib/` + `node_modules/@playwright/test/` |

> **Simple rule of thumb:**
> - **Engine** = the "car" (it can drive on its own if you write raw scripts)
> - **Test Runner** = the "race track organizer" (tells the car when to start, how many laps, and records the results)
> - **You write test files** that use the Test Runner's `test()` and `expect()` which in turn call the Engine's browser automation methods underneath.