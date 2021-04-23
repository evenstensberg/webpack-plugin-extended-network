const ChromeProtocol = require('./cri');

const flags = {
    port: '8090',
    hostname: 'localhost'
};
const connection = new ChromeProtocol(flags.port, flags.hostname);