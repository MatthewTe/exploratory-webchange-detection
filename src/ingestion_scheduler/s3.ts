import * as Minio from 'minio'
import dotenv from "dotenv";

dotenv.config({
    path: "../../deployments/local_envs/local-infra.env"
});

export const minioClient = new Minio.Client({
    endPoint: 'localhost',
    port: 9000,
    useSSL: false,
    accessKey: process.env.MINIO_ROOT_USER || "adminroot",
    secretKey: process.env.MINIO_ROOT_PASSWORD || "adminroot"
})

// https://min.io/docs/minio/linux/developers/javascript/API.html#makeBucket