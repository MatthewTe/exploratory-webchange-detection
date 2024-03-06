import {SECRET_POSTGRES_USER, SECRET_POSTGRES_PASSWORD, SECRET_POSTGRES_HOST, SECRET_POSTGRES_DATABASE } from "$env/static/private";
import postgres from 'postgres'

/** @import {ISnapshot} from '$lib/types.js' */

export async function GET({ url }) {
    
    // Url params:
    const website = url.searchParams.get("website" ?? null);
    const skip = url.searchParams.get("skip" ?? 0);
    const limit = url.searchParams.get("limit" ?? 100);

    const sql = postgres({
        host: SECRET_POSTGRES_HOST,
        port:5432,
        database: SECRET_POSTGRES_DATABASE,
        username: SECRET_POSTGRES_USER,
        password: SECRET_POSTGRES_PASSWORD
    })

    console.log(website);

    try {

        /** @type {ISnapshot[]} */
        let snapshots
        if (!website) {
            snapshots = await sql`
                SELECT * FROM public.snapshot 
                ORDER BY extracted_dt
                LIMIT ${limit}
                OFFSET ${skip}
            `
        } else {
            snapshots = await sql`
                SELECT * FROM public.snapshot 
                WHERE website = ${website} 
                ORDER BY extracted_dt 
                LIMIT ${limit}
                OFFSET ${skip}
                `
        }
        
        return new Response(JSON.stringify(snapshots), {
            headers: {
                "Content-Type": "application/json"
            },
            status: 200
        })
    } catch (err) {
        return new Response(JSON.stringify(err))
    }
}

export async function POST({ request }) {
    
    /** @type {ISnapshot[]} */
    const snapshotsToCreate = await request.json()

    const sql = postgres({
        host: SECRET_POSTGRES_HOST,
        port:5432,
        database: SECRET_POSTGRES_DATABASE,
        username: SECRET_POSTGRES_USER,
        password: SECRET_POSTGRES_PASSWORD
    })

    try {
        /** @type {ISnapshot[]} */
        const insertedSnapshots = await sql`INSERT INTO public.snapshot ${sql(snapshotsToCreate)} RETURNING *`;
        return new Response(JSON.stringify(insertedSnapshots), {
            headers: {
                "Content-Type": "application/json"
            },
            status: 201
        })
    } catch (err) {
        return new Response(JSON.stringify(err), {
            headers: {
                "Content-Type": "application/json"
            },
            status: 404
        })
    }
}