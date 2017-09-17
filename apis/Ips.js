var os = require('os');
let ifaces = os.networkInterfaces();
let addresses = [];
Object.keys(ifaces).forEach(function (ifname) {
    var alias = 0;
    ifaces[ifname].forEach(function (iface) {
        if ('IPv4' !== iface.family || iface.internal !== false) {
            // skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
            return;
        }
        addresses.push(iface.address);
    });
});
addresses.push("127.0.0.1");
exports.ip = (req, res, next) => {
    res.json(addresses);
};
export default exports.ip;