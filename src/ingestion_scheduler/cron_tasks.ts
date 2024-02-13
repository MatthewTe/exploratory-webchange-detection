import cron from 'node-cron';
import { IWebsite, ISeleniumContent } from "./ingestion_scheduler.types";
import { extractContentSeleniumWebpage } from "./selenium_functions";
import { streamHtmlPageToBucket, streamScreenshotPngToBucket } from "./s3";

export function createTaskFromWebsite(website: IWebsite): cron.ScheduledTask | undefined {

    const validCron: boolean = cron.validate(website.archive_period);
        
    if (validCron)
    {
        const task = cron.schedule(website.archive_period, () => {

            console.log(`[server]: Executing selenium content extraction for ${website.name}`)
            
            extractContentSeleniumWebpage(website.url, "Hello World")
                .then((seleniumContent: ISeleniumContent) => {
                    console.log(`[server]: Finished selenium content extraction for ${website.name}. Writing data to bucket`)
                    
                    streamHtmlPageToBucket(seleniumContent.htmlContent, website, seleniumContent.extractedDate);
                    streamScreenshotPngToBucket(seleniumContent.pageSnapshot, website, seleniumContent.extractedDate);
                    
                    console.log(`[server]: Successfully wrote ${website.name} data to bucket`)
                })
        }, {
            name: `${website.name} Archive ${website.archive_period}`
        })
        console.log(`[server]: Added ${website.name} as a scheduled task with period ${website.archive_period}`);

        return task
    }


}
