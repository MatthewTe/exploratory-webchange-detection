import {SECRET_POSTGRES_USER, SECRET_POSTGRES_PASSWORD, SECRET_POSTGRES_HOST, SECRET_POSTGRES_DATABASE } from "$env/static/private";
import postgres from "postgres";
/**
 * @import {IWebsite} from '$lib/types.js'
 */

export async function GET() {
    
    const sql = postgres({
        host: SECRET_POSTGRES_HOST,
        port:5432,
        database: SECRET_POSTGRES_DATABASE,
        username: SECRET_POSTGRES_USER,
        password: SECRET_POSTGRES_PASSWORD
    })

    /** @type {IWebsite[]} */
    try {
        const websites = await sql`SELECT * FROM public.website`

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

export async function POST({request}) {

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
        return new Response(JSON.stringify(insertedWebsites), {
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