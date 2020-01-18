const app = require("./index");

const Greenlock = require("greenlock");

const MaestroDns = require("./acme-dns-01-maestro");
const challenger = MaestroDns.create();
const ge = require("greenlock-express");

async function run() {
  const greenlock = Greenlock.create({
    packageRoot: __dirname,
    configDir: "greenlock.d",
    staging: true,

    // This should be the contact who receives critical bug and security notifications
    // Optionally, you may receive other (very few) updates, such as important new features
    maintainerEmail: "alamarre@gmail.com.com",

    // for an RFC 8555 / RFC 7231 ACME client user agent
    packageAgent: "videos.omny.ca/v1.0",
  });

  const settings = await greenlock.manager.defaults({
    // The "Let's Encrypt Subscriber" (often the same as the maintainer)
    // NOT the end customer (except where that is also the maintainer)
    subscriberEmail: "alamarre@gmail.com",
    agreeToTerms: true,
    challenges: {
      "dns-01": {
        module: __dirname + "/acme-dns-01-maestro",
      },
    },
  });
  const host = process.env.SSL_HOSTNAME;
  greenlock.add({
    subject: host,
    altnames: [host, `*.${host}`,],
  });


  ge.init({
    greenlock,

    // whether or not to run at cloudscale
    cluster: false,
  })
    // Serves on 80 and 443
    // Get's SSL certificates magically!
    .serve(app.callback());
}

run();
