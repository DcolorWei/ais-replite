import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { getIps } from './getIps.js';

puppeteer.use(StealthPlugin());

const ips = await getIps(1);

export async function getVesselListByArea(area_x, area_y) {
    const url = `${process.env.MARINE_ORIGIN_HOST}/getData/get_data_json_4/z:10/X:${area_x}/Y:${area_y}/station:0`;
    const { data } = await fetch(url,
        { agent: new HttpsProxyAgent(`http://${ips[0]}`) }
    )
        .then(res => res.json());
    return data.rows.map(item => item['SHIP_ID']);
}

export async function getVesselByVesselId(vessel_id) {
    const browser = await puppeteer.launch({
        executablePath: "D:/chrome-win/chrome.exe", headless: false,
        args: ["--start-maximized", `--proxy-server=${ips[0]}`,]
    }).catch(e => e);

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