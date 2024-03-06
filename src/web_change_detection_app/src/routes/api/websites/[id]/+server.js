import {SECRET_POSTGRES_USER, SECRET_POSTGRES_PASSWORD, SECRET_POSTGRES_HOST, SECRET_POSTGRES_DATABASE } from "$env/static/private";
import postgres from "postgres";

export async function DELETE({params, url}) {

    const websiteId = params.id

    if (!websiteId) {
        return new Response(JSON.stringify({message: "No Id provded"}))
    }

    const sql = postgres({
        host: SECRET_POSTGRES_HOST,
        port:5432,
        database: SECRET_POSTGRES_DATABASE,
        username: SECRET_POSTGRES_USER,
        password: SECRET_POSTGRES_PASSWORD
    })

    try {
        /** @type {IWebsite[]} */
        const deletedWebsite = await sql`DELETE FROM website WHERE id = ${websiteId} RETURNING *`

        // Now that the website has been inserted - send the reset request to the Selenium API to 
        // re-sync the cron jobs to the records in the database: 
        const reSyncResponse = await fetch(url.origin + '/api/tasks/sync')
        
        let deletedWebsiteResponse 
        if (reSyncResponse.ok) {
            const newTasks = await reSyncResponse.json()
            deletedWebsiteResponse  = {
                websites: deletedWebsite,
                sync: true,
                tasks: newTasks
            }
        } else {
            console.warn(`Unable to re-sync the tasks to the removed website entry`)
            deletedWebsiteResponse = {
                websites: deletedWebsite,
                sync: false,
                tasks: {}
            }
        }

        return new Response(JSON.stringify(deletedWebsiteResponse), {
            headers: {
                "Content-Type": "application/json"
            },
            status: 200,
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