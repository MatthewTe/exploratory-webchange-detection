import * as webdriver from "selenium-webdriver";
import { Options, ServiceBuilder } from "selenium-webdriver/chrome.js";
import { ISeleniumContent } from "./ingestion_scheduler.types";

const chromeDriverPath = "./chromedriver_mac64/chromedriver";

export async function extractContentSeleniumWebpage(url: string, seleniumPath: string): Promise<ISeleniumContent>  {

    // Config the webdriver pointing to a custom driver on fs:
    const driver: webdriver.WebDriver = await new webdriver.Builder()
        .forBrowser("chrome")
        .build();

    await driver.get(url);
    await driver.manage().setTimeouts({implicit: 500})

    await driver.executeScript("window.scrollTo(0, document.body.scrollHeight)");
    await driver.sleep(200);

    const pageSource: string = await driver.getPageSource();
    const pageSnapshot: string = await driver.takeScreenshot();
    const extractedDate: string = new Date().toJSON()

    await driver.quit()

    return {
        htmlContent: pageSource,
        pageSnapshot: pageSnapshot,
        extractedDate: extractedDate
    }
}