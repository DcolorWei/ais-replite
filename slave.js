import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
puppeteer.use(StealthPlugin());
import { getVesselByVesselId } from './method/vessel.js';
import { createConnection } from 'net';

import dotenv from 'dotenv';


dotenv.config();

const env = process.env;
const host = env.TCP_HOST || "127.0.0.1";
const port = env.TCP_PORT || 3544;

while (true) {
    await new Promise(resolve => setTimeout(resolve, 1000));

    const count = await fetch(`http://${host}:${port}/count`).then(r => r.text());
    console.log(new Date(), 'count:', count);

    const ip = await fetch(`http://${host}:${port}/get-ip`).then(r => r.text());
    if (count < 10) {
        console.log(new Date(), 'Wait for more task');
        await new Promise(resolve => setTimeout(resolve, 10000));
        continue;
    }

    if (ip === null) {
        continue;
    }
    console.log(`${ip}`);
    const taskIds = await Promise.all(
        [0, 0, 0, 0].map(async () => {
            return await fetch(`http://${host}:${port}/get-task`).then(r => r.text());
        })
    );
    console.log('taskIds:', taskIds);

    const browser = await puppeteer.launch({
        executablePath: "D:/chrome-win/chrome.exe", headless: false,
        args: ["--start-maximized", `--proxy-server=${ip.replace("_", ':')}`],
    }).catch(e => null);
    if (browser === null) {
        console.log(new Date(), 'Browser launch failed');
        await new Promise(resolve => setTimeout(resolve, 1000));
        continue;
    }
    await new Promise(resolve => setTimeout(resolve, 5000));

    const time = Date.now();
    await Promise.all(
        taskIds.filter(i => i).map(async (id, index) => {
            const record = await getVesselByVesselId(browser, id).catch(e => null);
            if (record) {
                await fetch(`http://${host}:${port}/add-record`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ record })
                }).catch(e => e);
            } else {
                if (Math.random() > 0.5) {
                    await fetch(`http://${host}:${port}/add-tasks`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ tasklist: [{ id, time }] })
                    }).catch(e => e);
                }
            }
        })
    );
    await browser.close().catch(e => e);;
}