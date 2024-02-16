import * as Minio from 'minio'
import { IWebsite, ISeleniumContent } from "./ingestion_scheduler.types";
import { extractContentSeleniumWebpage } from "./selenium_functions";
import { streamHtmlPageToBucket, streamScreenshotPngToBucket } from "./s3";
import { request } from 'express';

export function executePageArchivingTask(website: IWebsite) {

    console.log(`[server]: Executing selenium content extraction for ${website.name}`)
    
    extractContentSeleniumWebpage(website.url, "Hello World")
        .then((seleniumContent: ISeleniumContent) => {
            console.log(`[server]: Finished selenium content extraction for ${website.name}. Writing data to bucket`)
            
            // S3 ingestion:
            streamHtmlPageToBucket(seleniumContent.htmlContent, website, seleniumContent.extractedDate)
                .then(result => {
                    if (result) {
                        streamScreenshotPngToBucket(seleniumContent.pageSnapshot, website, seleniumContent.extractedDate)
                            .then(result => {
                                if (result) {
                                    console.log(`[server]: Inserted screenshot to storage bucket. Inserting record of ingestion to db`)
                                } else {
                                    console.log(`[server]: Error in inserting screenshot to storage bucket. Record insertion into db wil not take place.`)
                                }
                            })
                            .catch(err => console.log(`[server]: Serious error in screenshot bucket ignestion ${err.message}`))

                    } else {
                        console.log(`[server]: Error in inserting html page to storage bucket. Screenshot ingestion was not attempted`)
                    }
                })
                .catch(err => console.log(`[server]: Serious error in html bucket ignestion ${err.message}`))
            

            console.log(`[server]: Successfully wrote ${website.name} data to bucket`)
    })
}