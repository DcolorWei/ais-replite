export async function getIps(limit) {
    const url = env.url;
    const token = env.token;
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
            .catch(e => {
                reject(e);
            })
    })
}