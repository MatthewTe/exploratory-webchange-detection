import postgres from 'postgres';
import dotenv from "dotenv";

dotenv.config({
    path: "../../deployments/local_envs/local-infra.env"
});


export const sql = postgres({
    host: "localhost",
    port: 5432,
    database: "postgres",
    username: process.env.POSTGRES_USER || "admin",
    password: process.env.POSTGRES_PASSWORD || "admin"
})