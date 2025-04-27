import dotenv from "dotenv";
dotenv.config();
const env = process.env;
export async function getIps(limit) {
    const url = env.PROXY_URL;
    const token = env.PROXY_TOKEN;
    return new Promise((resolve, reject) => {
        fetch(`${url}?token=${token}&limit=${limit}&type=0&time=&split=1&split_text=`)
            .then(res => res.text())
            .then(data => {
                if (!data.includes("<br />")) {
                    resolve([]);
                    return;
                }
                resolve(data.split("<br />"));
            })
            .catch(e => resolve([]));
    })
}