import { getVesselListByArea, getVesselByVesselId } from './method/vessel.js';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
puppeteer.use(StealthPlugin({
}));
import dotenv from 'dotenv';

dotenv.config();

const env = process.env;
const host = env.TCP_HOST || "127.0.0.1";
const port = env.TCP_PORT || 3544;

(async () => {
    while (1) {
        const count = await fetch(`http://${host}:${port}/count`).then(r => r.text());
        if (count > 50) {
            await new Promise(resolve => setTimeout(resolve, 10000));
            continue;
        }

        const ip = await fetch(`http://${host}:${port}/get-ip`).then(r => r.text());
        const browser = await puppeteer.launch({
            executablePath: env.CHROME_PATH, headless: false,
            args: ["--start-maximized", `--proxy-server==${ip}`],
        }).catch(e => null);

        if (browser === null) {
            console.log('Browser launch failed');
            await new Promise(resolve => setTimeout(resolve, 1000));
            continue;
        }

        const shipIds = [];
        try {
            console.log(new Date(), 'count:');
            shipIds.push(...await getVesselListByArea(browser, env.LON, env.LAT));
        } catch (e) { e }
        shipIds.sort((a, b) => {
            if (a.elapsed < b.elapsed) return -1;
            if (a.elapsed > b.elapsed) return 1;
            return 0;
        });
        const filteredShipIds = shipIds.filter(i => Number(i.elapsed) < 3);
        console.log(shipIds.length, filteredShipIds.length)
        if (filteredShipIds.length === 0) {
            await new Promise(resolve => setTimeout(resolve, 100));
            continue;
        }
        const time = Date.now();
        await fetch(`http://${host}:${port}/add-tasks`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ tasklist: filteredShipIds.map(i => { return { id: i.id, time: time } }) })
        })
    }
})();