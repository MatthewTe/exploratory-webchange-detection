# Web Site Change Detection Repository

## Notes:
- Selenium browser currently does no scrolling. Don't support dynamic pages yet. Need to think more about how these should be done beacuse we cannot be scrolling forever.

### TODO:
- I'm somehow 3 abstraction levels deep now in creating and executing tasks: `createTaskFromWebsite()` goes to cron_tasks.ts  which then calls a bunch of functiosn wihtin the task callback. I should move the boilerplate logic from cron_taks into the index.js and the only abstraction should be the callback that gets triggered for a task: 
```javascript
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
```
`createTaskFromWebsite` should not exist. There should be a function called `executeTask()` or something that we use as the `cron.schedule()` callback:
```javascript
const task = cron.schedule(website.archive_period, executeTask())
```

- Pngs uploaded to blog are not valid. Need to find out [why](https://www.selenium.dev/documentation/webdriver/interactions/windows/#takescreenshot). Something about base64 encoding?

- The two blob functions are not great. Some issues to deal with:
    - They don't return any values despite being async. Should have them return a promise w/ the object id. (These are basic functions we might not even need the abstractions. Could just have the code in the task callback.)
    - There needs to be some error catching. Currently there is none (vague).

- Add new SQL functions that deal with ingesting and querying down the rows from db;

- Add the REST API to add or remove tasks. Already have a list function. Need logic to remove one if provided. And logic to restart a task too (delete a task and then pull the same one from the db)