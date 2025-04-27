import { getVesselListByArea, getVesselByVesselId } from './method/vessel.js';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
puppeteer.use(StealthPlugin());
import { createConnection } from 'net';

import dotenv from 'dotenv';

dotenv.config();

const env = process.env;
const host = env.TCP_HOST || "127.0.0.1";
const port = env.TCP_PORT || 3000;

(async () => {
    while (1) {
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
        if (count > 50) {
            console.log(new Date(), 'Wait for task be cleared...');
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
            client.once('error', () => client.destroy());
            await new Promise(resolve => setTimeout(resolve, 1000));
            r(ip);
        })
        if (ip === null) {
            continue;
        }
        console.log(`${ip}`);
        const browser = await puppeteer.launch({
            executablePath: env.CHROME_PATH, headless: true,
            args: ["--start-maximized", `--proxy-server=${ip.replace("_", ':')}`],
        }).catch(e => null);

        if (browser === null) {
            console.log('Browser launch failed');
            await new Promise(resolve => setTimeout(resolve, 1000));
            continue;
        }

        const shipIds = [];
        try {
            shipIds.push(...await getVesselListByArea(browser, env.LON, env.LAT));
        } catch (e) { e }
        shipIds.sort((a, b) => {
            if (a.elapsed < b.elapsed) return -1;
            if (a.elapsed > b.elapsed) return 1;
            return 0;
        });
        const filteredShipIds = shipIds.filter(i => Number(i.elapsed) < 3);
        if (filteredShipIds.length === 0) {
            await new Promise(resolve => setTimeout(resolve, 1000 * 15));
            continue;
        }
        const time = Date.now();
        filteredShipIds.forEach((i) => {
            const client = createConnection({ port, host }, () => {
                client.write(JSON.stringify({ action: 'addTask', data: { id: i.id, time: time } }));
            });
            client.on('error', () => client.destroy());
        });
    }
})();