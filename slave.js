import fs from 'fs';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
puppeteer.use(StealthPlugin());
import { getVesselByVesselId } from './method/vessel.js';
const taskDir = './task/';
const recordDir = './record/';

const idx = process.argv[2] || 0;

while (true) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    const taskTimes = fs.readdirSync(taskDir);
    if (taskTimes.length === 0) {
        console.log(new Date(), 'No tasks found');
        await new Promise(resolve => setTimeout(resolve, 10000));
        continue;
    }
    const taskFiles = fs.readdirSync(`${taskDir}/${taskTimes[0]}`);
    if (taskFiles.length === 0) {
        fs.rmdirSync(`${taskDir}/${taskTimes[0]}`, { recursive: true });
        continue;
    }

    const ips = [];
    do {
        ips.push(...fs.readdirSync("./ips"));
        await new Promise(resolve => setTimeout(resolve, 1000));
    } while (!ips.length);

    const ip = ips.pop();
    try {
        fs.unlinkSync(`./ips/${ip}`);
    } catch (e) { }
    console.log(`${ip}`);
    const browser = await puppeteer.launch({
        executablePath: "D:/chrome-win/chrome.exe", headless: true,
        args: ["--start-maximized", `--proxy-server=${ip.replace("_", ':')}`],
    });

    console.log(new Date(), taskFiles.length);
    await Promise.all(
        taskFiles.slice(0, 4).map(async (file, index) => {
            try {
                fs.unlinkSync(`${taskDir}/${taskTimes[0]}/${file}`);
                // 成功删除代表抢到任务，继续执行
                const [elapsed, id] = file.replace(".json", "").split('_');
                const info = await getVesselByVesselId(browser, id);
                if (!info) return
                const recordPath = `${recordDir}/${id}.json`;
                if (!fs.existsSync(recordPath)) {
                    fs.writeFileSync(recordPath, JSON.stringify([info]));
                    return;
                }
                const fileData = JSON.parse(fs.readFileSync(recordPath, 'utf-8').toString());
                fileData.push(info);
                try {
                    fs.writeFileSync(recordPath, JSON.stringify(fileData));
                } catch (e) { e }
            } catch (e) { e }
        })
    );
    browser.close();
}