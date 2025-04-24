import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { getIps } from './getIps.js';

puppeteer.use(StealthPlugin());
import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config();

const ips = await getIps(1);

export async function getVesselListByArea(area_x, area_y) {
    const ips = [];
    do {
        ips.push(...fs.readdirSync("./ips"));
        await new Promise(resolve => setTimeout(resolve, 1000));
    } while (!ips.length);

    const ip = ips.pop();
    try {
        fs.unlinkSync(`./ips/${ip}`);
    } catch (e) { }
    const browser = await puppeteer.launch({
        executablePath: "D:/chrome-win/chrome.exe", headless: true,
        args: ["--start-maximized", `--proxy-server=${ip.replace("_", ':')}`],
    }).catch(e => e)
    const page = await browser.newPage();
    const result = {
        static: null,
        position: null,
        voyage: null,
    }
    page.on('response', async (response) => {
        const request = response.request();
        const url = request.url();
        if (['/voyage', '/vessels'].every(i => url.includes(i))) {
            const data = (await response?.json());
            result.voyage = data;
        }
        if (['/position', '/vessels'].every(i => request.url().includes(i))) {
            const data = (await response?.json());
            result.position = data;
        }
        if (['/general', '/vessels'].every(i => request.url().includes(i))) {
            const data = (await response?.json());
            result.static = data;
        }
    });
    await page.goto(`${process.env.MARINE_ORIGIN_HOST}/en/ais/details/ships/shipid:${vessel_id}`).catch(e => e);
    for (let i = 0; i < 20; i++) {
        await new Promise(resolve => setTimeout(resolve, 500));
        if (Object.values(result).every(i => i)) break;
    }
    // await browser.close();
    return result;
}
getVesselListByArea(424, 196).then(vesselIds => {
    console.log(vesselIds);
    getVesselByVesselId(vesselIds[1]).then(vessel => {
        console.log(vessel);
    })
});