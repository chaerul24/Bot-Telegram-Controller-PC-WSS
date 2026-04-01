const os = require('os');
const { exec } = require('child_process');

class SystemService {
    constructor() {
        this.kode = Math.random().toString(36).substring(2, 10);
    }

    getInfo() {
        return {
            kode: this.kode,
            os: `${os.type()} ${os.release()}`,
            date: new Date().toLocaleString()
        };
    }

    // ================= SHUTDOWN =================
    shutdown() {
        const platform = process.platform;
        let command = "";

        if (platform === 'win32') {
            command = 'shutdown /s /t 0';
        } 
        else if (platform === 'linux') {
            command = 'shutdown now';
        } 
        else if (platform === 'darwin') {
            command = 'sudo shutdown -h now';
        }

        if (!command) {
            console.log("❌ OS tidak didukung:", platform);
            return;
        }

        console.log("⚡ Shutdown command:", command);

        exec(command, (err, stdout, stderr) => {
            if (err) {
                console.log("❌ Shutdown error:", err.message);
                return;
            }

            console.log("✅ Shutdown executed");
        });
    }

    // ================= OPTIONAL (BONUS) =================

    restart() {
        const platform = process.platform;

        let command = platform === 'win32'
            ? 'shutdown /r /t 0'
            : 'reboot';

        console.log("🔄 Restart:", command);
        exec(command);
    }

    sleep() {
        const platform = process.platform;

        let command = "";

        if (platform === 'win32') {
            command = 'rundll32.exe powrprof.dll,SetSuspendState 0,1,0';
        } 
        else if (platform === 'linux') {
            command = 'systemctl suspend';
        }

        console.log("😴 Sleep:", command);
        exec(command);
    }
}

module.exports = new SystemService();