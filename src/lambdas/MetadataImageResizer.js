const AWS = require("aws-sdk");

const DynamoDb = require("../impl/aws/DynamoDb");

const DYNAMO_TABLE = process.env.DYNAMO_TABLE || "maestro-media-center";
const dynamoClient = new AWS.DynamoDB.DocumentClient({ region: "us-east-1", });
const MAIN_ACCOUNT = process.env.MAIN_ACCOUNT;

const s3 = new AWS.S3({ region: "us-east-1", });

const MetadataManager = require("../metadata/MetadataManager");

const SOURCE_BUCKET = process.env.SOURCE_BUCKET || "metadata-images.omny.ca";
const DESTINATION_BUCKET = process.env.DESTINATION_BUCKET || "maestro-images.omny.ca";
const VALID_DIMENSIONS = process.env.VALID_DIMENSIONS
    ? JSON.parse(process.env.VALID_DIMENSIONS)
    : ["150x225", "227x127", "50x75",];

//const Sharp = require("sharp");
const jimp = require("jimp");
exports.handler = async (event, context, callback) => {
    const response = event.Records[0].cf.response;
    //await ready();

    console.log("Response status code :%s", response.status);

    //check if image is not present
    if (response.status == 404) {
        const request = event.Records[0].cf.request;

        const path = request.uri;
        const pathParts = decodeURIComponent(path).substring(1).split("/");
        if (pathParts.length < 2) {
            console.log(`invalid path provided in ${path}`);
            callback(null, response);
            return;
        }

        const account = pathParts.shift();
        const dimensionString = pathParts.shift();

        // if there is no dimension attribute, just pass the response
        if (!VALID_DIMENSIONS.includes(dimensionString)) {
            console.log(`invalid dimensions ${dimensionString} provided in ${path} `);
            callback(null, response);
            return;
        }

        console.log(`creating image for ${path}`);

        let dynamoDb = new DynamoDb(dynamoClient, DYNAMO_TABLE, account);
        if (account == MAIN_ACCOUNT) {
            dynamoDb = new DynamoDb(dynamoClient, DYNAMO_TABLE);
        }

        const sourceType = pathParts.shift();
        let sourceImage = null;

        const dimensions = dimensionString.split("x");

        const metadataManager = new MetadataManager(dynamoDb);
        if (sourceType == "movies") {
            const name = pathParts.shift();
            const movieName = name.substring(0, name.lastIndexOf("."));
            const metadata = await metadataManager.getMovieMetadata(movieName);
            if (!metadata || !metadata.poster) {
                console.log(`no metadata for movie ${movieName}`);
            }
            else {
                sourceImage = `${metadata.source.toLowerCase()}/movie/${metadata.id}/poster.jpg`;
            }
        } else if (sourceType === "tv") {
            const subType = pathParts.shift();
            if (subType === "show") {
                const name = pathParts.shift();
                const showName = name.substring(0, name.lastIndexOf("."));
                const metadata = await metadataManager.getTvShowMetadata(showName);
                if (!metadata || !metadata.poster) {
                    console.log(`no metadata for show ${showName}`);
                }
                else {
                    sourceImage = `${metadata.source.toLowerCase()}/tv/show/${metadata.id}/poster.jpg`;
                }
            } else if (subType === "episode") {
                const showName = pathParts.shift();
                const season = pathParts.shift();
                const name = pathParts.shift();
                const episode = name.substring(0, name.lastIndexOf("."));
                const metadata = await metadataManager.getTvEpisodeMetadata(showName, season, episode);
                if (!metadata || !metadata.poster) {
                    console.log(`no metadata for tv episode ${showName} ${season} ${episode}`);
                }
                else {
                    sourceImage = `${metadata.source.toLowerCase()}/tv/episode/${metadata.id}/poster.jpg`;
                }
            }
        }

        // read the S3 key from the path variable.
        // Ex: path variable /images/100x100/webp/image.jpg
        const key = path.substring(1);

        const width = parseInt(dimensions[0], 10);
        const height = parseInt(dimensions[1], 10);

        // correction for jpg required for 'Sharp'
        const requiredFormat = "png";
        const originalKey = sourceImage || "fallback.png";
        const resized = `${dimensionString}/${originalKey.replace(".jpg", ".png")}`;
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

            response.status = 200;
            response.body = result.Body.toString("base64");
            response.bodyEncoding = "base64";
            if (!response.headers) {
                response.headers = {};
            }
            response.headers["content-type"] = [{ key: "Content-Type", value: "image/" + requiredFormat, },];
            
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

            await s3.putObject({
                Bucket: SOURCE_BUCKET,
                Key: resized,
                Body: newImageBuffer,
            }).promise();

            await s3.putObject({
                Bucket: DESTINATION_BUCKET,
                Key: key,
                Body: newImageBuffer,
            }).promise();

            response.status = 200;
            response.body = newImageBuffer.toString("base64");
            response.bodyEncoding = "base64";
            if (!response.headers) {
                response.headers = {};
            }
            response.headers["content-type"] = [{ key: "Content-Type", value: "image/" + requiredFormat, },];
        }
    }
    callback(null, response);
};