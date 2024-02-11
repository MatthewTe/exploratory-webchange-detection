import * as webdriver from "selenium-webdriver";
import { Options, ServiceBuilder } from "selenium-webdriver/chrome.js";

const chromeDriverPath = "./chromedriver_mac64/chromedriver";

const chromeOptions = {
    args: [],
    binary: chromeDriverPath
}

const driver = await new webdriver.Builder()
    .forBrowser('chrome')
    .setChromeOptions(chromeOptions)
    .build();


await driver.get("https://www.reddit.com/");
await driver.manage().setTimeouts({implicit: 500})

await driver.executeScript("window.scrollTo(0, document.body.scrollHeight)")
await driver.sleep(2000);

const pageSource = await driver.getPageSource()

console.log(pageSource); 
