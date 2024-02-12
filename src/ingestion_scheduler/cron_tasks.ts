import cron from 'node-cron';
import { IWebsite, ISeleniumContent } from "./ingestion_scheduler.types";
import { extractContentSeleniumWebpage } from "./selenium_functions"

export function createTaskFromWebsite(website: IWebsite): cron.ScheduledTask | undefined {

    const validCron: boolean = cron.validate(website.archive_period);
        
    if (validCron)
    {
        const task = cron.schedule(website.archive_period, () => {

            console.log(`[server]: Executing selenium content extraction for ${website.name}`)
            
            extractContentSeleniumWebpage(website.url, "Hello World")
                .then((seleniumContent: ISeleniumContent) => {
                    console.log(`[server]: Finished selenium content extraction for ${website.name}`)
                })
        }, {
            name: `${website.name} Archive ${website.archive_period}`
        })
        console.log(`[server]: Added ${website.name} as a scheduled task with period ${website.archive_period}`);

        return task
    }


}
