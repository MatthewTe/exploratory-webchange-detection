import { SECRET_SELENIUM_HOST } from "$env/static/private";

export async function GET() {
    // Send request to the SYNC endpoint of the Selenium container to re-sync the cron jobs to the 
    // current state of the website table:
    const response = await fetch(SECRET_SELENIUM_HOST + "/api/tasks/reset/")

    if (response.ok) {
        const taskResponses = await response.json()
        return new Response(JSON.stringify(taskResponses), {
            headers: {
                "Content-Type": "application/json"
            },
            status: 201,
        })
    } else {
        return new Response(JSON.stringify({message: "Error in resetting tasks"}), {
            headers: {
                "Content-Type": "application/json"
            },
            status: 201,
        })
    }

}