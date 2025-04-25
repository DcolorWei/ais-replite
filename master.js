import { getVesselListByArea, getVesselByVesselId } from './method/vessel.js';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
puppeteer.use(StealthPlugin());
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

(async () => {
    while (1) {
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
        fs.mkdirSync(`./task/${time}`);
        filteredShipIds.forEach((i) => {
            fs.writeFileSync(`./task/${time}/${i.elapsed}_${i.id}.json`, JSON.stringify(i));
        });
        while (1) {
            await new Promise(resolve => setTimeout(resolve, 1000 * 10));
            const taskDir = './task/';
            const taskList = fs.readdirSync(taskDir);
            if (taskList.length === 0) {
                break;
            }
            if (taskList.length > 1) {
                continue;
            }
            const taskFiles = fs.readdirSync(`${taskDir}/${taskList[0]}`);
            if (taskFiles.length < 70) {
                break;
            }
            console.log(new Date(), 'wait task be cleared...');
        }
    }
})();