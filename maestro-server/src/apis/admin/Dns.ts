import IDatabase from '../../database/IDatabase';
import * as Router from 'koa-router';
import SimpleValue from '../../models/SimpleValue';

const ALLOWED_TYPES = ["cname", "txt", "a"];
const DNS_ZONE = process.env.DNS_ZONE;

var cf = require('cloudflare')({
  email: process.env.CLOUDFLARE_EMAIL,
  key: process.env.CLOUDFLARE_KEY
});

//cf.zones.browse().then(console.log);

async function getAllRecords() {
  let results = [];
  const first = await cf.dnsRecords.browse(DNS_ZONE, { per_page: 50 });
  results = results.concat(first.result);

  const pages = first.result_info.total_pages;
  if (pages > 1) {
    for (var i = 2; i < pages; i++) {
      const current = await cf.dnsRecords.browse(DNS_ZONE, { page: i, per_page: 50 });
      results = results.concat(current.result);
    }
  }
  return results;
}

const logger = require("../../impl/logger").logger("DnsApi");

/*getAllRecords().then(records => {
  console.log(records);
})// */
class DnsApi {
  constructor(private router: Router, private db: IDatabase, private metadataFetcher) {
    this.init();
  }

  async setRecord(ctx) {
    const { type, name, } = ctx.params;
    const body = ctx.request.body;

    if (!body || !body.value) {
      ctx.status = 400;
    }

    const { value } = body;
    const root = await this.db.get<SimpleValue>("domain", "primary");
    if (!root || !root.value || !name.endsWith(root.value)) {
      ctx.status = 403;
      return;
    }

    if (!ALLOWED_TYPES.includes(type.toLowerCase())) {
      ctx.status = 403;
      return;
    }
    const newRecord = {
      type: type.toUpperCase(),
      name: name.toLowerCase(),
      content: value
    };

    const records = await getAllRecords();

    const relevant = records.filter(r => r.name == name);
    if (relevant.length == 1 && type != "TXT") {
      const id = relevant[0].id;
      logger.info("updating record", { type, name, value });
      await cf.dnsRecords.edit(DNS_ZONE, id, newRecord);
    } else {
      logger.info("adding record", { type, name, value });
      await cf.dnsRecords.add(DNS_ZONE, newRecord);
    }

    ctx.status = 204;
  }

  async getRecord(ctx) {
    const { type, name, } = ctx.params;

    const root = await this.db.get<SimpleValue>("domain", "primary");
    if (!root || !root.value || !name.endsWith(root.value)) {
      ctx.status = 403;
      return;
    }

    if (!ALLOWED_TYPES.includes(type.toLowerCase())) {
      ctx.status = 403;
      return;
    }

    const records = await getAllRecords();

    const relevant = records.filter(r => r.name == name);
    if (relevant.length == 1) {
      ctx.body = relevant[0];
    } else {
      ctx.status = 404;
    }
  }

  async deleteRecord(ctx) {
    const { type, name, } = ctx.params;

    const body = ctx.request.body;
    if (!body || !body.value) {
      ctx.status = 400;
    }

    const { value } = body;

    const root = await this.db.get<SimpleValue>("domain", "primary");
    if (!root || !root.value || !name.endsWith(root.value)) {
      ctx.status = 403;
      return;
    }

    if (!ALLOWED_TYPES.includes(type.toLowerCase())) {
      ctx.status = 403;
      return;
    }

    const records = await getAllRecords();

    const relevant = records.filter(r => r.name == name && r.value == value);
    if (relevant.length == 1) {
      logger.info("deleting record", { type, name, value });
      await cf.dnsRecords.del(DNS_ZONE, relevant[0].id);
    } else {
      //ctx.status = 404;
    }
    ctx.status = 204;
  }

  init() {
    this.router.put("/record/:type/:name", this.setRecord.bind(this));
    this.router.get("/record/:type/:name", this.getRecord.bind(this))
    this.router.delete("/record/:type/:name", this.deleteRecord.bind(this))
  }
}

module.exports = DnsApi;
