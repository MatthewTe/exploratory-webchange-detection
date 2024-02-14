import * as Minio from 'minio'
import { IWebsite, ISeleniumContent } from "./ingestion_scheduler.types";
import { extractContentSeleniumWebpage } from "./selenium_functions";
import { streamHtmlPageToBucket, streamScreenshotPngToBucket } from "./s3";

export function executePageArchivingTask(website: IWebsite) {

    console.log(`[server]: Executing selenium content extraction for ${website.name}`)
    
    extractContentSeleniumWebpage(website.url, "Hello World")
        .then((seleniumContent: ISeleniumContent) => {
            console.log(`[server]: Finished selenium content extraction for ${website.name}. Writing data to bucket`)
            
            // S3 ingestion:
            streamHtmlPageToBucket(seleniumContent.htmlContent, website, seleniumContent.extractedDate)
            streamScreenshotPngToBucket(seleniumContent.pageSnapshot, website, seleniumContent.extractedDate);
            
            console.log(`[server]: Successfully wrote ${website.name} data to bucket`)
    })
}