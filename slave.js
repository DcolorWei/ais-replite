import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
puppeteer.use(StealthPlugin());
import { getVesselByVesselId } from './method/vessel.js';
import { createConnection } from 'net';

import dotenv from 'dotenv';

dotenv.config();

const env = process.env;
const host = env.TCP_HOST || "127.0.0.1";
const port = env.TCP_PORT || 3000;

while (true) {
    await new Promise(resolve => setTimeout(resolve, 1000));

    const count = await new Promise(async r => {
        let count = null;
        const client = createConnection({ port, host }, () => {
            client.write(JSON.stringify({ action: 'count' }));
        });
        client.once('data', (data) => {
            count = JSON.parse(data).count;
            client.destroy();
        });
        client.once('error', () => client.destroy());

        await new Promise(resolve => setTimeout(resolve, 1000));
        r(count);
    });
    console.log(new Date(), 'count:', count);
    if (count < 10) {
        console.log(new Date(), 'Wait for more task');
        await new Promise(resolve => setTimeout(resolve, 10000));
        continue;
    }

    const ip = await new Promise(async r => {
        let ip = null;
        const client = createConnection({ port, host }, () => {
            client.write(JSON.stringify({ action: 'getIp' }));
        });
        client.once('data', (data) => {
            ip = JSON.parse(data).ip;
            client.destroy();
        });
        client.on('error', () => client.destroy());

        await new Promise(resolve => setTimeout(resolve, 1000));
        r(ip);
    });
    if (ip === null) {
        continue;
    }
    console.log(`${ip}`);
    const taskIds = await Promise.all(
        [0, 0, 0, 0].map(async () => {
            return await new Promise(async r => {
                let task = null;
                const client = createConnection({ port, host }, () => {
                    client.write(JSON.stringify({ action: 'getTask' }));
                });
                client.once('data', (data) => {
                    task = JSON.parse(data).id;
                    client.destroy();
                });
                client.on('error', () => client.destroy());
                await new Promise(resolve => setTimeout(resolve, 1500));
                r(task);
            });
        })
    );
    console.log('taskIds:', taskIds);

    const browser = await puppeteer.launch({
        executablePath: "D:/chrome-win/chrome.exe", headless: true,
        args: ["--start-maximized", `--proxy-server=${ip.replace("_", ':')}`],
    });
    await new Promise(resolve => setTimeout(resolve, 5000));

    await Promise.all(
        taskIds.filter(i => i).map(async (id, index) => {
            const record = await getVesselByVesselId(browser, id);
            const client = createConnection({ port, host }, async () => {
                client.write(JSON.stringify({ action: 'addRecord', data: { record } }));
            });
            client.on('error', () => client.destroy());
        })
    );
    browser.close();
}