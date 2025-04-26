import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
puppeteer.use(StealthPlugin());
import { getVesselByVesselId } from './method/vessel.js';
import { createConnection } from 'net';
const port = 3000;
const host = '127.0.0.1';

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
        while (count === null) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            console.log(new Date(), 'wait for count...');
        }
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
        while (ip === null) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            console.log(new Date(), 'wait for ip...');
        }
        r(ip);
    });
    console.log(`${ip}`);
    const taskIds = [];
    for (let i = 0; i < 4; i++) {
        const id = await new Promise(async r => {
            let task = null;
            const client = createConnection({ port, host }, () => {
                client.write(JSON.stringify({ action: 'getTask' }));
            });
            client.once('data', (data) => {
                task = JSON.parse(data).id;
                client.destroy();
            });
            while (task === null) {
                await new Promise(resolve => setTimeout(resolve, 1000));
                console.log(new Date(), 'wait for task...');
            }
            r(task);
        });
        taskIds.push(id);
    }
    console.log('taskIds:', taskIds);

    const browser = await puppeteer.launch({
        executablePath: "D:/chrome-win/chrome.exe", headless: true,
        args: ["--start-maximized", `--proxy-server=${ip.replace("_", ':')}`],
    });
    await new Promise(resolve => setTimeout(resolve, 5000));

    await Promise.all(
        taskIds.map(async (id, index) => {
            const record = await getVesselByVesselId(browser, id);
            const client = createConnection({ port, host }, async () => {
                client.write(JSON.stringify({ action: 'addRecord', data: { record } }));
            });
        })
    );
    browser.close();
}