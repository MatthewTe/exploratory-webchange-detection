import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
import { sql } from "./db";
import { minioClient } from "./s3"
import { IWebsite, ISeleniumContent, ISnapshot } from "./ingestion_scheduler.types";
import { PostgresError } from "postgres";
import cron from 'node-cron';
import {executePageArchivingTask} from "./cron_tasks"
import {logger} from "./logger";


const app: Express = express();
app.use(express.json())

const port = process.env.PORT || 3001;

app.get("/", (req: Request, res: Response) => {
    res.send("Hello Wolrd");
});

app.get("/api/websites", (req: Request, res: Response) => { 
    const websites = sql<IWebsite[]>`SELECT * FROM website`.then(results => {
        if (!results.length)
        {
            return res.status(200).json({"message": "No Websites entries returned from database"})
        }
        return res.json(results);
    }).catch(err => {
        if (err instanceof PostgresError) 
        {
            return res.status(400).json({
                "message": `Database Error: ${err.message}`
            })
        } else {
            return res.status(400).json({
                "message": `Non-Database Error: ${err.message}`
            })
        }
    })
    
});

app.get("/api/website/snapshots/:id", (req: Request<{id: string}>, res: Response) => {

    if (req.params && req.params.id && typeof req.params.id === "string") {
        const websites = sql<ISnapshot[]>`SELECT * FROM snapshot WHERE website = ${req.params.id} ORDER BY extracted_dt`
            .then(results => {
                if (!results.length) {
                    return res.status(200).json({"message": "No snapshot entries returned from database"})
                }
                return res.json(results)
            })
            .catch(err => {
                if (err instanceof PostgresError)
                {
                    return res.status(400).json({'message':`Database Error: ${err.message}`})
                } else {
                    return res.status(400).json({'message':`Non-Database Error: ${err.message}`})
                }
            })
        }
})

// TODO: Build the GET request api for the comparisons table in the database.

app.post("/api/website/", (req: Request, res: Response) => {
    try
    {
        const websites: IWebsite[] = (req.body as IWebsite[])
        const createdWebsite = sql<IWebsite[]>`
            INSERT INTO website ${ sql(websites) }
            returning *
        `.then(results => {
            if (!results.length)
            {
                return res.json({
                    "message": `No Website results found in the db. Likely entry was not created ${results}`
                })
            } else
            {
                return res.status(201).json(results)
            }
        }).catch(err => {
            if (err instanceof PostgresError)
            {
                return res.status(400).json({
                    "message": `Database Error: ${err.message}`
                })
            }
            else {
                return res.status(400).json({
                    "message": `Non-Database Error: ${err.message}`
                })
            }
        })
    }
    catch(err: any)
    {
        return res.status(400).json({"message": JSON.parse(err.message)})
    }
})

app.get("/api/tasks", (req: Request, res: Response) => {

    const tasks: Map<string, cron.ScheduledTask> = cron.getTasks();
    const taskNames: string[] = []
    for (let [name, task] of tasks) {
        taskNames.push(name)
    }

    res.status(200).json(taskNames)
})

app.post("/api/tasks/reset/", (req: Request, res: Response) => {
    
    // Original Tasks:
    const originalTasks: Map<string, cron.ScheduledTask> = cron.getTasks();
    const originalNames: string[] = []
    for (let [name, task] of originalTasks) {
        originalNames.push(name)
    }
    
    logger.info(`[server]: Resetting the tasks`)
    originalTasks.forEach((task, key) => {
        logger.info(`[server]: Removing task ${key}`)
        task.stop()
    })

    logger.info(`[server]: Getting the new task list from the database`)
    const websites = sql<IWebsite[]>`SELECT * FROM website`.then(results => {
        if (results.length)
        {
            results.forEach(website => {

                const validCron: boolean = cron.validate(website.archive_period);
                    
                if (validCron)
                {
                    const task = cron.schedule(website.archive_period, () => executePageArchivingTask(website), {
                        name: `${website.name} Archive ${website.archive_period}`
                    })
                    logger.info(`[server]: Added ${website.name} as a scheduled task with period ${website.archive_period}`);
                }
            })

            // New Tasks:
            const newTasks: Map<string, cron.ScheduledTask> = cron.getTasks();
            const newNames: string[] = []
            for (let [name, task] of newTasks) {
                newNames.push(name)
            }
            logger.info(`[server]: New tasks created.`)

            res.status(201).json({
                "previous_tasks": originalNames,
                "new_tasks": newNames
            })
        }
    })


})


app.listen(port, () => {
    logger.info(`[server]: Server is running at http://localhost:${port}`);
    
    // Ensuring the appropriate s3 buckets have been created:

    minioClient.bucketExists("archives", (err, exists: boolean) => {
        if (err) {
            logger.error(`[server]: Error in determining if bucket archives exists ${err.message}`)
        }
        if (exists) {
            logger.info(`[server]: Archive bucket already exists`)
        } else {
            minioClient.makeBucket("archives", (err) => {
                if (err) {
                    logger.error(`[server]: Error in creating archives bucket`, err)
                } 
                else {
                    logger.info(`[server]: Sucessfully created bucket 'archives'`)
                }
            })
        }
    })
   
    // Creating scheduler:
    const websites = sql<IWebsite[]>`SELECT * FROM website`.then(results => {
        if (results.length)
        {
            results.forEach(website => {

                const validCron: boolean = cron.validate(website.archive_period);
                    
                if (validCron)
                {
                    const task = cron.schedule(website.archive_period, () => executePageArchivingTask(website), {
                        name: `${website.name} Archive ${website.archive_period}`
                    })
                    logger.info(`[server]: Added ${website.name} as a scheduled task with period ${website.archive_period}`);
                }
            })
        }
    })

});