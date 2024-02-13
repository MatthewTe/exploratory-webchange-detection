import * as Minio from 'minio'
import dotenv from "dotenv";
import { IWebsite } from "./ingestion_scheduler.types";
import { extractContentSeleniumWebpage } from './selenium_functions';
dotenv.config({
    path: "../../deployments/local_envs/local-infra.env"
});

const minioClient = new Minio.Client({
    endPoint: 'localhost',
    port: 9000,
    useSSL: false,
    accessKey: process.env.MINIO_ROOT_USER || "adminroot",
    secretKey: process.env.MINIO_ROOT_PASSWORD || "adminroot"
})

// https://min.io/docs/minio/linux/developers/javascript/API.html#makeBucket
async function streamHtmlPageToBucket(html: string, website: IWebsite, extractedDate: string) {

    console.log(`[server]: Starting to write html page to storage bucket`)

    minioClient.putObject(
        "archives", 
        `${website.id}/${extractedDate}/${website.name}_content.html`,
        html,
        ((err: any, objInfo: Minio.UploadedObjectInfo) => {
            if (!err) {
                console.log(`[server]: Successfully wrote ${website.name} to storage bucket. etag: ${objInfo.etag}`)
            }
        })
    )

}

async function streamScreenshotPngToBucket(png: string, website: IWebsite, extractedDate: string) {
    console.log(`[server]: Starting to write page screenshot to storage bucket`)

    minioClient.putObject(
        "archives", 
        `${website.id}/${extractedDate}/${website.name}_screenshot.png`,
        png,
        ((err: any, objInfo: Minio.UploadedObjectInfo) => {
            if (!err) {
                console.log(`[server]: Successfully wrote ${website.name} to storage bucket. etag: ${objInfo.etag}`)
            }
        })
    )

}


export {minioClient, streamHtmlPageToBucket, streamScreenshotPngToBucket}