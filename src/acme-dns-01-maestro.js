

var MyModule = module.exports;

const hostBasePath = process.env.DNS_ROUTE;
const fetch = require("node-fetch");

MyModule.create = function (options) {

  var m = {};

  m.init = async function ({ request, }) {
    // (optional) initialize your module
  };

  m.zones = async function ({ dnsHosts, }) {
    // return a list of "Zones" or "Apex Domains" (i.e. example.com, NOT foo.example.com)
    return ["omny.ca",];
  };

  m.set = async function ({ challenge: { dnsZone, dnsPrefix, dnsHost, keyAuthorizationDigest, }, }) {
    // set a TXT record for dnsHost with keyAuthorizationDigest as the value
    const url = hostBasePath.replace("{{host}}", dnsPrefix + "." + dnsZone).replace("{{recordType}}", "TXT");
    await fetch(url, {
      method: "PUT",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ value: keyAuthorizationDigest, }),
    });
  };

  m.get = async function ({ challenge: { dnsZone, dnsPrefix, dnsHost, keyAuthorizationDigest, }, }) {
    // check that the EXACT a TXT record that was set, exists, and return it
    const url = hostBasePath.replace("{{host}}", dnsPrefix + "." + dnsZone).replace("{{recordType}}", "TXT");
    const result = await fetch(url, {
      method: "GET",
    });
    const record = await result.json();
    return record.content;
  };

  m.remove = async function ({ challenge: { dnsZone, dnsPrefix, dnsHost, keyAuthorizationDigest, }, }) {
    // remove the exact TXT record that was set
    const url = hostBasePath.replace("{{host}}", dnsPrefix + "." + dnsZone).replace("{{recordType}}", "TXT");
    await fetch(url, {
      method: "DELETE",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ value: keyAuthorizationDigest, }),
    });
  };

  return m;
};
