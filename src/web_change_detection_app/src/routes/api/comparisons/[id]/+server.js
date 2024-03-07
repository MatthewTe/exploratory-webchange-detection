import {SECRET_POSTGRES_USER, SECRET_POSTGRES_PASSWORD, SECRET_POSTGRES_HOST, SECRET_POSTGRES_DATABASE } from "$env/static/private";
import postgres from 'postgres'

/**
 * @import {ISnapshotComparison} from '$/types.js'
 */

export async function GET({params}) {

    const sql = postgres({
        host: SECRET_POSTGRES_HOST,
        port:5432,
        database: SECRET_POSTGRES_DATABASE,
        username: SECRET_POSTGRES_USER,
        password: SECRET_POSTGRES_PASSWORD
    })

    try {
        /** @type {ISnapshotComparison[]} */
        const snapshots = await sql`SELECT * FROM public.comparison WHERE id = ${params.id}`

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
