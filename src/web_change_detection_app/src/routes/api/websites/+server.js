import {SECRET_POSTGRES_USER, SECRET_POSTGRES_PASSWORD, SECRET_POSTGRES_HOST, SECRET_POSTGRES_DATABASE } from "$env/static/private";
import postgres from "postgres";
import * as Minio from 'minio'
/**
 * @import {IWebsite} from '$/types.js'
 */

export async function GET({ url }) {
    
    const sql = postgres({
        host: SECRET_POSTGRES_HOST,
        port:5432,
        database: SECRET_POSTGRES_DATABASE,
        username: SECRET_POSTGRES_USER,
        password: SECRET_POSTGRES_PASSWORD
    })
    
    const skip = url.searchParams.get("skip" ?? 0);
    const limit = url.searchParams.get("limit" ?? 100);

    /** @type {IWebsite[]} */
    try {
        const websites = await sql`
            SELECT * FROM public.website
            LIMIT ${limit}
            OFFSET ${skip}
        `

        return new Response(JSON.stringify(websites), {
            headers: {
                "Content-Type": "application/json"
            }
        })
    } catch (err) {
        return new Response(JSON.stringify({message: err}), {
            status: 404,
            headers: {
                "Content-Type": "application/json"
            }
        })
    }}

export async function POST({request, url }) {

    /** @type {IWebsite[]} */
    const webSitesToInsert = await request.json()

    const sql = postgres({
        host: SECRET_POSTGRES_HOST,
        port:5432,
        database: SECRET_POSTGRES_DATABASE,
        username: SECRET_POSTGRES_USER,
        password: SECRET_POSTGRES_PASSWORD
    })

    try {
        /** @type {IWebsite[]} */
        const insertedWebsites = await sql`INSERT INTO website ${sql(webSitesToInsert)} RETURNING *`

        // Now that the website has been inserted - send the reset request to the Selenium API to 
        // re-sync the cron jobs to the records in the database: 
        const reSyncResponse = await fetch(url.origin + '/api/tasks/sync')
        
        let insertedWebsiteResponse 
        if (reSyncResponse.ok) {
            const newTasks = await reSyncResponse.json()
            insertedWebsiteResponse = {
                websites: insertedWebsites,
                sync: true,
                tasks: newTasks
            }
        } else {
            console.warn(`Unable to re-sync the tasks to the newly inserted website entry`)
            insertedWebsiteResponse = {
                websites: insertedWebsites,
                sync: false,
                tasks: {}
            }
        }

        return new Response(JSON.stringify(insertedWebsiteResponse), {
            headers: {
                "Content-Type": "application/json"
            },
            status: 201,
        })
    } catch (err) {
        return new Response(JSON.stringify({message: err}), {
            status: 404,
            headers: {
                "Content-Type": "application/json"
            }
        })
    }
}

