var os = require('os');
import {NetworkInterfaceInfo} from "os";
let ifaces = os.networkInterfaces();
import {Request, Response, NextFunction} from "express";

let addresses : string[] = [];
Object.keys(ifaces).forEach(function (ifname) {
  var alias = 0;

  ifaces[ifname].forEach(function (iface : NetworkInterfaceInfo) {
    if ('IPv4' !== iface.family || iface.internal !== false) {
      // skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
      return;
    }
		addresses.push(iface.address);
  });
});

addresses.push("127.0.0.1");

export let ip = (req: Request, res: Response, next: NextFunction) => {
	res.json(addresses);
}

export default ip;
