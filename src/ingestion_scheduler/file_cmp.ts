import { IWebsite, ISnapshot, ISnapshotComparison } from "./ingestion_scheduler.types";
import { sql } from './db';
import axios from "axios";
import {logger} from "./logger";

export function performFileComparison(currentSnapshot: ISnapshot, website: IWebsite) {
    
    // Querying the previous snapshot that is previous to the website:
    if (currentSnapshot.id) {
        const result = sql<ISnapshot[]>`
            SELECT * 
            FROM snapshot
            WHERE extracted_dt < (SELECT extracted_dt FROM snapshot WHERE id = ${currentSnapshot.id})
            AND website = ${currentSnapshot.website}
            ORDER BY extracted_dt DESC
            LIMIT 1
        `.then(results => {
            if (results.length && results.length < 2) {

                const previousSnapshot = results[0]

                logger.info(`Performing unified diff logic between the current snapshot: ${currentSnapshot.id} and previous snapshot: ${previousSnapshot.id}`)
                
                axios.post("http://127.0.0.1:8000/comparison/", {
                    websiteName: website.name,
                    currentSnapshot: currentSnapshot,
                    previousSnapshot: previousSnapshot
                })
                .then(response => {

                    const generatedComparison: ISnapshotComparison | string = <ISnapshotComparison> response.data;

                    logger.info(`[server]: Successfully generated a unified diff comparsion and saved it to the database ${generatedComparison.id}`)

                })
                .catch((err) => logger.error(`[server]: Error in generating a diff comparison ${err}`))
            }
        })
        .catch((err) => logger.error(`[server]: Error in querying snapshot ${currentSnapshot.id} from database. ${err}`))
    }
}
