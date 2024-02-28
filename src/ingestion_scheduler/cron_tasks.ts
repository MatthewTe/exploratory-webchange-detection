import * as Minio from 'minio'
import { IWebsite, ISeleniumContent, ISnapshot } from "./ingestion_scheduler.types";
import { extractContentSeleniumWebpage } from "./selenium_functions";
import { streamHtmlPageToBucket, streamScreenshotPngToBucket } from "./s3";
import { performFileComparison } from './file_cmp'
import { sql } from './db';
import {logger} from "./logger";

export function executePageArchivingTask(website: IWebsite) {

    logger.info(`[server]: Executing selenium content extraction for ${website.name}`)
    
    extractContentSeleniumWebpage(website.url, "./selenium/chromedriver")
        .then((seleniumContent: ISeleniumContent) => {
            logger.info(`[server]: Finished selenium content extraction for ${website.name}. Writing data to bucket`)
            
            // S3 ingestion: HTML Page:
            streamHtmlPageToBucket(seleniumContent.htmlContent, website, seleniumContent.extractedDate)
                .then(result => {
                    if (result) {
                        // S3 ingestion PNG Screenshot:
                        streamScreenshotPngToBucket(seleniumContent.pageSnapshot, website, seleniumContent.extractedDate)
                            .then(result => {
                                if (result) {
                                    logger.info(`[server]: Inserted screenshot to storage bucket. Inserting record of ingestion to db`)
                                    
                                    // Snapshot column database ingestion:
                                    const newSnapshot: ISnapshot =  {
                                        extracted_dt: seleniumContent.extractedDate,
                                        static_dir_root: `${website.id}/${seleniumContent.extractedDate}/`,
                                        website: sql.typed(website.id, 2950)
                                    }
                                    
                                    logger.info(website)

                                    const result = sql`INSERT INTO snapshot ${sql(newSnapshot, 'extracted_dt', 'static_dir_root', 'website')} RETURNING *`
                                        .then(results => {
                                            if (results.length)
                                            {
                                                logger.info(`[server]: Sucessfully inserted new snapshot into snapshot table: ${results}`)

                                                // Performing Comparison:
                                                let insertedSnapshot = (results[0] as ISnapshot)
                                                performFileComparison(insertedSnapshot, website)

                                            } else {
                                                logger.error(`[server]: Error in inserting new snapshot into database. Result returned empty for ingestion ${website.name} | ${website.id}`)
                                            }
                                        })
                                        .catch(err => {
                                            logger.error(`[server]: Hard error in inserting snapshot into the database table: ${err.message}`)
                                        })

                                } else {
                                    logger.error(`[server]: Error in inserting screenshot to storage bucket. Record insertion into db wil not take place.`)
                                }
                            })
                            .catch(err => logger.error(`[server]: Serious error in screenshot bucket ignestion ${err.message}`))

                    } else {
                        logger.error(`[server]: Error in inserting html page to storage bucket. Screenshot ingestion was not attempted`)
                    }
                })
                .catch(err => logger.error(`[server]: Serious error in html bucket ignestion ${err.message}`))
            

            logger.info(`[server]: Successfully wrote ${website.name} data to bucket`)
        }).catch(err => {
            logger.error(`[server]: Error in extracting the selenium content ${err.stack}`)
        })
}