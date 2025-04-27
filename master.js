import { getVesselListByArea, getVesselByVesselId } from './method/vessel.js';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
puppeteer.use(StealthPlugin());
import dotenv from 'dotenv';
import { createConnection } from 'net';
const port = 3000;
const host = '127.0.0.1';

dotenv.config();

(async () => {
    while (1) {
        try {
            const count = await new Promise(async r => {
                let count = null;
                const client = createConnection({ port, host }, () => {
                    client.write(JSON.stringify({ action: 'count' }));
                });
                client.once('data', (data) => {
                    count = JSON.parse(data).count;
                    client.destroy();
                });
                while (count === null) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    console.log(new Date(), 'wait for count...');
                }
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
                while (ip === null) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    console.log(new Date(), 'wait for ip...');
                }
                r(ip);
            })
            console.log(`${ip}`);
            const browser = await puppeteer.launch({
                executablePath: "D:/chrome-win/chrome.exe", headless: true,
                args: ["--start-maximized", `--proxy-server=${ip.replace("_", ':')}`],
            }).catch(e => e)

            const master = {
                area: { x: 122.2, y: 29.9 },
                currentList: [],
                currentTime: Date.now(),
            };
            const shipIds = [];
            try {
                shipIds.push(...await getVesselListByArea(browser, master.area.x, master.area.y));
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
        } catch (e) { e }
    }
})();