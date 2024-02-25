import { minioClient } from "./s3";
import { IWebsite, ISnapshot, ISnapshotComparison } from "./ingestion_scheduler.types";
import { sql } from './db';
import { JSDOM } from 'jsdom';
import fs from 'fs';
import { exec } from 'child_process';
import cheerio, { Cheerio, load } from "cheerio";
import axios from "axios";

function stripContentFromHtml(html: string): string {
    const dom = new JSDOM(html);
    const document = dom.window.document;

    document.querySelectorAll('*').forEach(element => {
        element.innerHTML = ''
    })

    return document.documentElement.outerHTML;

}

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
                
                axios.post("http://127.0.0.1:8000/comparison/", {
                    websiteName: website.name,
                    currentSnapshot: currentSnapshot,
                    previousSnapshot: previousSnapshot
                })
                .then(response => {

                    const generatedComparison: ISnapshotComparison | string = <ISnapshotComparison> response.data;

                    console.log(`[server]: Successfully generated a unified diff comparsion and saved it to the database ${generatedComparison.id}`)

                })
                .catch((err) => console.log(`[server]: Error in generating a diff comparison ${err}`))
            }
        })
    }
}
