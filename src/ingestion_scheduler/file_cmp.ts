import { minioClient } from "./s3";
import { IWebsite, ISnapshot } from "./ingestion_scheduler.types";
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
                .then(response => {console.log(response)})
                .catch((err) => console.log(err))
                

                // Now grab the two files from the storage bucket:
                let newestHtmlFileChunk: Uint8Array[] = []
                let newestStrippedHtmlContent: string 
                let previousHtmlFileChunk: Uint8Array[] = []
                let previousStrippedHtmlContent: string
                
                /*
                console.log("Current bucket storage")
                const chunks: Uint8Array[] = []

                minioClient.getObject("archives", `${newestSnapshot.static_dir_root}${website.name}_content.html`, 
                    (err, dataStream) => {
                        if (err) {
                            console.error("Error retrieving object from Minio:", err);
                            return;
                        }

                        dataStream.on('data', (chunk) => {
                            newestHtmlFileChunk.push(chunk);
                        });

                        dataStream.on('end', () => {
                            const data = Buffer.concat(newestHtmlFileChunk);
                            
                            const $ = load(data);

                            $('*').each((index, element) => {
                                $(element).contents().filter((i, el) => el.type === 'text').remove();
                            });

                            newestStrippedHtmlContent = $.html();
                            fs.writeFile('temp/newestStrippedHtmlFile.html', newestStrippedHtmlContent, 'utf8', (err) => {
                                if (err) {
                                    console.log(err)
                                    return
                                }
                                console.log("Writing newest html content to file")
                            })

                        });

                        dataStream.on('error', (err) => {
                            console.error("Error reading data stream:", err);
                        });
                })
                
                console.log("Previous bucket storage")
                minioClient.getObject("archives", `${previousSnapshot.static_dir_root}${website.name}_content.html`, 
                    (err, dataStream) => {
                        if (err) {
                            console.error("Error retrieving object from Minio:", err);
                            return;
                        }

                        dataStream.on('data', (chunk) => {
                            previousHtmlFileChunk.push(chunk);
                        });

                        dataStream.on('end', () => {
                            const data = Buffer.concat(previousHtmlFileChunk);
                            
                            fs.writeFile('temp/prevFullHtmlFile.html', data.toString('utf-8'), 'utf8', (err) => {})

                            const $ = load(data);

                            $('*').each((index, element) => {
                                $(element).contents().filter((i, el) => el.type === 'text').remove();
                            });

                            previousStrippedHtmlContent = $.html();
                            fs.writeFile('temp/prevStrippedHtmlFile.html', previousStrippedHtmlContent, 'utf8', (err) => {
                                if (err) {
                                    console.log(err)
                                    return
                                }
                                console.log('Writing prev html content to file')
                            })


                        });

                        dataStream.on('error', (err) => {
                            console.error("Error reading data stream:", err);
                        });
                })
                // https://github.com/steveukx/git-js#how-to-specify-options
                exec(
                    '/usr/bin/git diff --no-index temp/newestStrippedHtmlFile.html temp/prevStrippedHtmlFile.html', 
                    (err, stdout, stderr) => {
                        if (err) {
                            console.error(err);
                            return;
                        }

                        console.log(stdout);

                        fs.unlinkSync("temp/newestStrippedHtmlFile.html");
                        fs.unlinkSync("temp/prevStrippedHtmlFile.html");
                    }
                )

            */
            }
        })
    }
}
