const screenshot = require('screenshot-desktop');
const sharp = require('sharp');

module.exports = {
    async capture() {
        try {
            const img = await screenshot({ format: 'png' });

            // 🔥 compress + resize
            const compressed = await sharp(img)
                .resize({ width: 800 }) // kecilin
                .jpeg({ quality: 50 })  // kompres
                .toBuffer();

            console.log("📸 size:", compressed.length);

            return compressed.toString('base64');

        } catch (err) {
            console.log("❌ Screenshot error:", err.message);
            return null;
        }
    }
};