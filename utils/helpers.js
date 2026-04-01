const os = require('os');

function getRandomPort() {
    return Math.floor(10000 + Math.random() * 50000);
}

function generateToken() {
    return Math.random().toString(36).substring(2, 8);
}

function getLocalIP() {
    const nets = os.networkInterfaces();
    const wifi = nets['Wi-Fi'];

    if (!wifi) return 'localhost';

    for (const net of wifi) {
        if (net.family === 'IPv4' && !net.internal) {
            return net.address;
        }
    }

    return 'localhost';
}

module.exports = { getRandomPort, generateToken, getLocalIP };