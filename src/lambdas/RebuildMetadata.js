const metaDataRebuilder = require("../impl/aws/MetadataRebuilder");

exports.handler = async () => {
    await metaDataRebuilder();
};

if(process.env.RUN_LOCAL) {
    exports.handler().catch(e => {
        console.error(e);
        process.exit(1);
    });
}