import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
import { sql } from "./db";
import { minioClient } from "./s3"
import { IWebsite, ISnapshot, ISnapshotComparison } from "./ingestion_scheduler.types";
import { PostgresError } from "postgres";
import cron from 'node-cron';
import { BucketItemFromList } from "minio";

dotenv.config({
    path: "../../deployments/local_envs/local-infra.env"
});

const app: Express = express();
app.use(express.json())

const port = process.env.PORT || 3001;

app.get("/", (req: Request, res: Response) => {
    res.send("Express + TypeScript Server");
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

app.get("/api/tasks", (req: Request, res: Response)=> {

    const tasks: Map<string, cron.ScheduledTask> = cron.getTasks();
    const taskNames: string[] = []
    for (let [name, task] of tasks) {
        taskNames.push(name)
    }

    res.status(200).json(taskNames)
})

app.listen(port, () => {
    console.log(`[server]: Server is running at http://localhost:${port}`);
    
    // Creating scheduler:
    const websites = sql<IWebsite[]>`SELECT * FROM website`.then(results => {
        if (results.length)
        {
            results.forEach(website => {
                const validCron: boolean = cron.validate(website.archive_period);
                
                if (validCron)
                {
                    const task = cron.schedule(website.archive_period, () => {
                        console.log(`This is the scheduled task for website ${website.name}`);
                    }, {
                        name: `${website.name} Archive ${website.archive_period}`
                    })
                    console.log(`[server]: Added ${website.name} as a scheduled task`);
                }
            })
        }
    })

    // Ensuring the appropriate s3 buckets have been created:
    minioClient.bucketExists("archives", (err, exists: boolean) => {
        if (err) {
            console.log(`[server]: Error in determining if bucket archives exists ${err.message}`)
        }
        if (exists) {
            console.log(`[server]: Archive bucket already exists`)
        } else {
            minioClient.makeBucket("archives", (err) => {
                if (err) {
                    console.log(`[server]: Error in creating archives bucket`, err)
                } 
                else {
                    console.log(`[server]: Sucessfully created bucket 'archives'`)
                }
            })
        }
    })

});