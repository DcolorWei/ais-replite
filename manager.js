import { getIps } from './method/getIps.js';
import fs from 'fs';
import { createServer } from 'net';
const PORT = 3000;
const HOST = '127.0.0.1';

const tasks = [];
const records = [];

// 创建TCP服务器
const server = createServer((socket) => {
    // 接收数据                                     
    socket.on('data', (dta) => {
        const { action, data } = JSON.parse(dta.toString());
        switch (action) {
            case 'getIp':
                const ip = ips.pop();
                if (!ip) return null;
                socket.write(JSON.stringify({ ip: ip }));
                break;
            case 'count':
                socket.write(JSON.stringify({ count: tasks.length }));
                break;
            case 'addTask':
                if (!data.time || !data.id) {
                    socket.write(JSON.stringify({ status: false }));
                    return;
                }
                tasks.push({ id: data.id, time: data.time });
                break;
            case 'getTask':
                const task = tasks.pop();
                if (!task) return null;
                socket.write(JSON.stringify({ id: task.id }));
                break;
            case 'addRecord':
                if (!data.record) {
                    socket.write(JSON.stringify({ status: false }));
                    return;
                }
                console.log(new Date(), 'add record:', data.record);
                records.push(data.record);
                break;
            default:
                socket.write(JSON.stringify({ status: true }));
                break;
        }
    });
    socket.on('error', () => socket.destroy());
});

// 启动服务器
server.listen(PORT, HOST);

const ips = await getIps(90);
console.log(ips.length);
setInterval(async () => {
    const newIps = await getIps(90);
    console.log(new Date(), newIps.length, 'update ips...');
    if (!newIps.length) return;
    ips.length = 0;
    ips.push(...newIps);
}, 1000 * 60); // 每分钟更新一次IP列表



setInterval(() => {
    if (!records.length) return;
    fs.writeFileSync(`./records/record_${Date.now()}.json`, JSON.stringify(records));
    records.length = 0;
}, 1000 * 60);
