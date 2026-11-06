import { chromium, Browser, BrowserContext, Page } from 'playwright';


async function run() {

    let browser: Browser = await chromium.launch({ headless: false });
let context: BrowserContext = await browser.newContext();
let page: Page = await context.newPage();
    await page.goto('https://playwright.dev/');
    //await page.waitForTimeout(5000);
    
    //Clean up - reverse order
    await page.close();
    await context.close();
    await browser.close();

}

run();
