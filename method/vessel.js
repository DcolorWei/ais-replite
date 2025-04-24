import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
puppeteer.use(StealthPlugin());
import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config();


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
    const url = `${process.env.MARINE_ORIGIN_HOST}/en/ais/home/centerx:${area_x}/centery:${area_y}/zoom:11`;
    const shipList = [];
    page.on('response', async (response) => {
        const request = response.request();
        const url = request.url();
        if (url.includes('/getData/get_data_json_4') && url.includes('station')) {
            const { data } = (await response?.json());
            const rowsData = data['rows'];
            shipList.push(...rowsData.map(i => {
                return {
                    id: i['SHIP_ID'],
                    type: i['SHIPTYPE'],
                    classBFlag: i['DESTINATION'] === 'CLASS B',
                    elapsed: i['ELAPSED'],
                }
            }));
        }
    });
    await page.goto(url).catch(e => e);
    for (let i = 0; i < 15; i++) {
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    await browser.close();
    return shipList;
}

export async function getVesselByVesselId(browser, vessel_id) {
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
            try {
                const data = (await response?.json());
                result.voyage = data;
            } catch (e) { e }
        }
        if (['/position', '/vessels'].every(i => request.url().includes(i))) {
            try {
                const data = (await response?.json());
                result.position = data;
            } catch (e) { e }
        }
        if (['/general', '/vessels'].every(i => request.url().includes(i))) {
            try {
                const data = (await response?.json());
                result.static = data;
            } catch (e) { e }
        }
    });
    await page.goto(`${process.env.MARINE_ORIGIN_HOST}/en/ais/details/ships/shipid:${vessel_id}`).catch(e => e);
    for (let i = 0; i < 20; i++) {
        await new Promise(resolve => setTimeout(resolve, 500));
        // 如果page的title是"Page not found"则说明没有找到该船舶，直接返回
        const title = await page.title();
        if (title.includes('Just a moment')) break;
        if (Object.values(result).every(i => i)) break;
    }
    try {
        await page.close();
    } catch (e) { e }
    // 等待页面关闭的缓存被清除
    await new Promise(resolve => setTimeout(resolve, 5000));
    if (Object.values(result).every(i => i)) {
        return result;
    } else {
        return null;
    }
}