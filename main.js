// nodejs 从cmd里面通过 devtunnel user show -v 获取信息


const {exec} = require("child_process");
const spawn = require('child_process').spawn;

class DevtunnelNoLoginError extends Error {
    constructor(message) {
        super(message);
        this.name = "DevtunnelNoLoginError";
    }
}

function toLogin() {
    return new Promise((resolve, reject) => {
        // 登陆
        exec(`C:\\Users\\Administrator\\AppData\\Local\\Microsoft\\WinGet\\Links\\devtunnel.exe user login -g`, async (error, stdout, stderr) => {
            console.log(stdout);
            if (stdout.includes("Logged in")) {
                // 重新获取登陆信息
                resolve(await getTokenByLogin());
            } else {
                reject(new Error('登陆失败'));
            }
        })
    })
}

function getTokenByLogin(times = 0) {
    const cmd = `C:\\Users\\Administrator\\AppData\\Local\\Microsoft\\WinGet\\Links\\devtunnel.exe user show -v`;
    return new Promise((resolve, reject) => {
        exec(cmd, (error, stdout, stderr) => {
            if (stdout.includes("Logged in as")) {
                // 正则匹配 Logged in as imblowsnow using GitHub.
                if (stdout.match(/Logged in as (.*) using GitHub\./)) {
                    console.log('Logined as github');
                    // UserId: [\w]+\n(.*?)\n
                    resolve('github ' + stdout.match(/UserId:[^\n]+\n([^\n]+)\n/)[1]);
                } else if (stdout.match(/Logged in as (.*) using Microsoft\./)) {
                    console.log('Logined as azure');
                    // PUID:[\s\S]+\n(.*?)\n
                    console.log(stdout.match(/PUID:[^\n]+\n([^\n]+)\n/));
                    resolve('Bearer ' + stdout.match(/PUID:[^\n]+\n([^\n]+)\n/)[1]);
                }
            } else {
                reject(new DevtunnelNoLoginError('未登陆'));
            }
            console.log(stdout);
        })
    })
}

toLogin().then((token) => {
    console.log(token);
})
//
// getTokenByLogin().then((token) => {
//     console.log(token);
// })
