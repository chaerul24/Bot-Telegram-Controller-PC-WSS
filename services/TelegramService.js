const TelegramBot = require('node-telegram-bot-api');
const notifier = require('node-notifier');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const WebSocketService = require('./WebSocketService');
const SystemService = require('./SystemService');
const { getRandomPort, getLocalIP } = require('../utils/helpers');
class TelegramService {

    constructor(token) {
        this.bot = new TelegramBot(token, { polling: true });
        this.waitingWallpaper = {};

        this.chatId = process.env.CHAT_ID || null;

        this.init();
        this.handleExit();
    }

    // ================= AUTO CONNECT =================
    sendStartup() {
        if (!this.chatId) return;

        const info = SystemService.getInfo();

        this.bot.sendMessage(this.chatId,
            `🟢 DEVICE CONNECTED

Kode: ${info.kode}
OS: ${info.os}
Date: ${info.date}`);
    }

    // ================= AUTO DISCONNECT =================
    handleExit() {
        process.on('SIGINT', () => {
            if (!this.chatId) return;

            const info = SystemService.getInfo();

            this.bot.sendMessage(this.chatId,
                `🔴 DEVICE DISCONNECTED

Kode: ${info.kode}
Date: ${info.date}`);

            process.exit();
        });
    }

    // ================= INIT =================
    init() {

        // 🔥 AUTO DETECT CHAT_ID
        this.bot.on('message', (msg) => {
            console.log('CHAT_ID:', msg.chat.id);

            // simpan otomatis kalau belum ada
            if (!this.chatId) {
                this.chatId = msg.chat.id;

                console.log('CHAT_ID saved:', this.chatId);

                this.sendStartup(); // kirim connect setelah dapat ID
            }
        });

        // ================= STATUS =================
        this.bot.onText(/\/start/, (msg) => {
            const info = SystemService.getInfo();

            this.bot.sendMessage(msg.chat.id,
                `📡 DEVICE STATUS

Kode: ${info.kode}
OS: ${info.os}
Date: ${info.date}`);
        });

        // ================= LIVE =================
        this.bot.onText(/\/live/, (msg) => {
            const port = getRandomPort();
            const token = WebSocketService.createToken();

            WebSocketService.createServer(port);

            const url = `http://${getLocalIP()}:${port}/live?kode=${token}`;

            this.bot.sendMessage(msg.chat.id, `🚀 Live:\n${url}`);
        });

        // ================= MESSAGE TO PC =================
        this.bot.onText(/\/msg (.+)/, (msg, match) => {
            notifier.notify({
                title: 'System',
                message: match[1],
                sound: true
            });

            this.bot.sendMessage(msg.chat.id, '✅ Terkirim ke PC');
        });

        // ================= WALLPAPER =================
        this.bot.onText(/\/change_wallpaper/, (msg) => {
            this.waitingWallpaper[msg.chat.id] = true;
            this.bot.sendMessage(msg.chat.id, 'Kirim gambar');
        });
        this.bot.onText(/\/shutdown\s+(.+)/, (msg, match) => {
            console.log("🔥 SHUTDOWN DETECTED");

            const inputKode = match[1].trim();
            const deviceKode = SystemService.kode;

            console.log("INPUT:", inputKode);
            console.log("DEVICE:", deviceKode);

            if (inputKode !== deviceKode) {
                return this.bot.sendMessage(msg.chat.id,
                    `❌ Kode salah

Gunakan kode:
${deviceKode}`);
            }

            this.bot.sendMessage(msg.chat.id,
                `⚠️ SHUTDOWN DIJALANKAN

Kode: ${deviceKode}`);

            SystemService.shutdown();
        });
        // ================= CONNECT APPROVAL =================
        this.bot.onText(/\/connect (.+)/, (msg, match) => {
            const inputKode = match[1];
            const deviceKode = SystemService.kode;

            if (inputKode !== deviceKode) {
                return this.bot.sendMessage(msg.chat.id, "❌ Kode salah");
            }

            WebSocketService.setAllowedCode(inputKode);

            this.bot.sendMessage(msg.chat.id,
                `✅ CONNECT APPROVED

Kode: ${inputKode}
Akses aktif 30 detik`);
        });

        // ================= HANDLE PHOTO =================
        this.bot.on('photo', async (msg) => {
            if (!this.waitingWallpaper[msg.chat.id]) return;

            const photo = msg.photo.pop();
            const file = await this.bot.getFile(photo.file_id);

            const url = `https://api.telegram.org/file/bot${process.env.BOT_TOKEN}/${file.file_path}`;
            const filePath = path.join(__dirname, '../wallpaper.jpg');

            const res = await axios({ url, responseType: 'stream' });
            const writer = fs.createWriteStream(filePath);

            res.data.pipe(writer);

            writer.on('finish', () => {
                this.bot.sendMessage(msg.chat.id, '✅ Wallpaper updated');
            });

            delete this.waitingWallpaper[msg.chat.id];
        });
    }
}

module.exports = TelegramService;