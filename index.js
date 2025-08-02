import 'dotenv/config';
import { chromium } from "playwright-core";
import Browserbase from "@browserbasehq/sdk";

if (!process.env.BROWSERBASE_API_KEY || !process.env.BROWSERBASE_PROJECT_ID) {
    throw new Error("Muse have BROWSERBASE_API_KEY and BROWSERBASE_PROJECT_ID env variables");
}

const bb = new Browserbase({
    apiKey: process.env.BROWSERBASE_API_KEY,
});

async function getWebsiteHTMLAndScreenshot(url) {
    const session = await bb.sessions.create({
        projectId: process.env.BROWSERBASE_PROJECT_ID,
    });

    // Connect to the session
    const browser = await chromium.connectOverCDP(session.connectUrl);

    try {
        // Getting the default context to ensure the sessions are recorded.
        const defaultContext = browser.contexts()[0];
        const page = defaultContext?.pages()[0];

        if (!page) {
            throw new Error("Couldn't connect to browser");
        }

        await page.goto(url, { waitUntil: "networkidle" });

        const html = await page.content();
        const buffer = await page.screenshot({ fullPage: true });
        const screenshotBase64 = buffer.toString("base64");

        await page?.close();
        await browser.close();

        return {
            html,
            screenshotBase64
        };
    } catch (err) {
        console.error(err);
        await browser.close();
    }
}

import express from "express";
const app = express();
const port = 3001;

app.get('/', async (req, res) => {
    if (!req.query.url) {
        res.send(401);
    }

    const data = await getWebsiteHTMLAndScreenshot(req.query.url);

    res.json(data);
})

app.listen(port, () => {
    console.log(`App listening on port ${port}`)
})