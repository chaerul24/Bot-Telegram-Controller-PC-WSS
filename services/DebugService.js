const screenshot = require('screenshot-desktop');
const fs = require('fs');

class DebugService {

    static async testScreenshot() {
        try {
            console.log("📸 Testing screenshot...");

            const img = await screenshot({ format: 'jpg' });

            fs.writeFileSync('test.jpg', img);

            console.log("✅ Screenshot berhasil → test.jpg");
        } catch (err) {
            console.error("❌ Screenshot ERROR:", err);
        }
    }

}

module.exports = DebugService;