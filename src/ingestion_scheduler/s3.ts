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

async function streamHtmlPageToBucket(html: string, website: IWebsite, extractedDate: string): Promise<Minio.UploadedObjectInfo | any> {

    console.log(`[server]: Starting to write html page to storage bucket ${website.name}`)

    try {
        return new Promise((resolve, reject) => {
            minioClient.putObject(
                "archives", 
                `${website.id}/${extractedDate}/${website.name}_content.html`,
                html,
                ((err: any, objInfo: Minio.UploadedObjectInfo) => {
                    if (!err) {
                        console.log(`[server]: Successfully wrote ${website.name} to storage bucket. etag: ${objInfo.etag}`)
                        resolve(objInfo)
                    } else {
                        console.log(`[server]: Error in inserting html page into storage bucket ${err.message}`)
                        reject(err)
                    }
                })
            )

        })
    } catch (err: any) {
        console.log(`Uncaught error in minio html ingestion ${err.message}`)
    }

}

async function streamScreenshotPngToBucket(png: string, website: IWebsite, extractedDate: string): Promise<Minio.UploadedObjectInfo | any> {
    
    console.log(`[server]: Starting to write page screenshot to storage bucket ${website.name}`)

    return new Promise((resolve, reject) => {
        const pngBuffer = Buffer.from(png, 'base64');

        minioClient.putObject(
            "archives", 
            `${website.id}/${extractedDate}/${website.name}_screenshot.png`,
            pngBuffer,
            ((err: any, objInfo: Minio.UploadedObjectInfo) => {
                if (!err) {
                    console.log(`[server]: Successfully wrote ${website.name} to storage bucket. etag: ${objInfo.etag}`)
                    resolve(objInfo)
                } else {
                    console.log(`[server]: Error in inserting snapshot png to storage bucket ${err.message}`)
                    reject(err)
                }
            })
        )
    })

}


export {minioClient, streamHtmlPageToBucket, streamScreenshotPngToBucket}