import { getIps } from './method/getIps.js';
import fs from 'fs';

const newIps = await getIps(90);
const old = fs.readdirSync("./ips");
old.forEach(ip => {
    try {
        fs.unlinkSync(`./ips/${ip}`);
    } catch (e) { e }
});
newIps.forEach(ip => {
    fs.writeFileSync(`./ips/${ip.replace(":", '_')}`, '');
});
setInterval(async () => {
    const newIps = await getIps(90);
    const old = fs.readdirSync("./ips");
    old.forEach(ip => {
        try {
            fs.unlinkSync(`./ips/${ip}`);
        } catch (e) { e }
    });
    newIps.forEach(ip => {
        try {
            fs.writeFileSync(`./ips/${ip.replace(":", '_')}`, '');
        } catch (e) { e }
    });
}, 1000 * 60);