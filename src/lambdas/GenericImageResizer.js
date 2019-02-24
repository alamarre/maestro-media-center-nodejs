const AWS = require("aws-sdk");

const KEEP_COPY_IN_SOURCE_BUCKET = process.env.KEEP_COPY_IN_SOURCE_BUCKET === "true";

const s3 = new AWS.S3({ region: "us-east-1", });

const SOURCE_BUCKET = process.env.SOURCE_BUCKET || "metadata-images.omny.ca";
const DESTINATION_BUCKET = process.env.DESTINATION_BUCKET || "maestro-images.omny.ca";

//const Sharp = require("sharp");
const jimp = require("jimp");
const normalize = require("./utilities/EventNormalizer");
exports.handler = async (event) => {
    
    const records = normalize(event);
    await Promise.all(records.map(async record => {
        console.log(JSON.stringify(record));
        const width = record.width;
        const height = record.height;
        const sourceImage = record.sourceImage;
        const key = record.destinationImage;

        const originalKey = sourceImage || "fallback.png";
        const resized = `${width}x${height}/${originalKey.replace(".jpg", ".png")}`;
        console.log(`trying to copy ${resized} will fall back to ${originalKey}`);
        try {
            // get appropriate size
            const result = await s3.getObject({
                Bucket: SOURCE_BUCKET,
                Key: resized,
            }).promise();

            console.log(`${resized} found copying to ${key}`);

            // put in destination
            await s3.putObject({
                Bucket: DESTINATION_BUCKET,
                Key: key,
                Body: result.Body,
            }).promise();           
        } catch (e) {
            console.log(`${resized} not found falling back to ${originalKey}`);
            // get full size and put in appropriate size in source and destination
            const result = await s3.getObject({
                Bucket: SOURCE_BUCKET,
                Key: originalKey,
            }).promise();
            const image = await jimp.read(result.Body);
            const newImageBuffer = await image
                .resize(width, height)
                .getBufferAsync("image/png");

            if(KEEP_COPY_IN_SOURCE_BUCKET) {
                await s3.putObject({
                    Bucket: SOURCE_BUCKET,
                    Key: resized,
                    Body: newImageBuffer,
                }).promise();
            }

            await s3.putObject({
                Bucket: DESTINATION_BUCKET,
                Key: key,
                Body: newImageBuffer,
            }).promise();
        }
    }));
};