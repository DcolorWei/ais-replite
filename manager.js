import { getIps } from './method/getIps.js';
import fs from 'fs';
const PORT = 3544;
const HOST = '127.0.0.1';
import express from "express";
import bodyParser from "body-parser";
import cors from "cors";

const app = express();
app.use(cors());
app.use(bodyParser.json());

const tasks = [];
const records = [];

app.get("/get-ip", (req, res) => {
    const ip = ips.pop();
    if (!ip) return res.send("")
    res.send(ip)
})

app.get("/count", (req, res) => {
    res.send(tasks.length)
})

app.get("/get-task", (req, res) => {
    const task = tasks.pop();
    if (!task) return null;
    res.send(String(task.id));
})

app.post("/add-tasks", (req, res) => {
    const { tasklist } = req.body;
    console.log(tasklist)
    if (tasklist) tasks.push(...tasklist);
    res.send("");
})

app.post("/add-record", (req, res) => {
    const { record } = req.body;
    if (record) records.push(record);
    res.send("");
})

// 启动服务器
app.listen(PORT, HOST);

const ips = await getIps(90);
console.log(ips.length);
setInterval(async () => {
    if (ips.length > 500) ips.length = 0;
    const newIps = await getIps(90);
    console.log(new Date(), ips.length, 'update ips...');
    if (!newIps.length) return;
    ips.push(...newIps);
}, 1000 * 60); // 每分钟更新一次IP列表



setInterval(() => {
    if (!records.length) return;
    fs.writeFileSync(`./records/record_${Date.now()}.json`, JSON.stringify(records));
    records.length = 0;
}, 1000 * 90);
