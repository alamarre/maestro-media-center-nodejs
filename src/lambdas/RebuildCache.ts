const cacheRebuilder = require("../impl/aws/CacheRebuilder");

exports.handler = async () => {
    await cacheRebuilder();
};

if(process.env.RUN_LOCAL) {
    exports.handler().catch(e => {
        console.error(e);
        process.exit(1);
    });
}