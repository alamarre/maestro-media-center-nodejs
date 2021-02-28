var os = require("os");
const ifaces = os.networkInterfaces();
const addresses = [];
Object.keys(ifaces).forEach(function (ifname) {
    ifaces[ifname].forEach(function (iface) {
        if ("IPv4" !== iface.family || iface.internal !== false) {
            // skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
            return;
        }
        addresses.push(iface.address);
    });
});
addresses.push("127.0.0.1");
exports.ip = (ctx) => {
    ctx.body = (addresses);
};
module.exports=exports.ip;