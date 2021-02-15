class S3Db {
    constructor(s3, bucket, prefix) {
        this.s3 = s3;
        this.bucket = bucket;
        this.prefix = prefix;
    }
    getKey(pathParts) {
        if(this.prefix) {
            pathParts.unshift(this.prefix);
        }
        const path = pathParts.join("/");
        return path;
    }

    async get(...pathParams) {
        const file = this.getKey(pathParams) + ".json";
        try {
			const result = await this.s3.getObject({
				Bucket: this.bucket,
				Key: file,
			}).promise();
			return JSON.parse(result.Body);
		} catch (e) {
            return null;
        }
    }

    async set(value, ...pathParams) {
        const file = this.getKey(pathParams) + ".json";
        await this.s3.putObject({
            Bucket: this.bucket,
            Key: file,
            Body: JSON.stringify(value),
        }).promise();
    }

    async addToStringSet(value, column, ...pathParams) {
        const file = this.getKey(pathParams) + ".json";
        let obj = {};
        try {
			const result = await this.s3.getObject({
				Bucket: this.bucket,
				Key: file,
			}).promise();
			obj = JSON.parse(result.Body);
		} catch (e) {
            obj[column] = value;
        }

        await this.s3.putObject({
            Bucket: this.bucket,
            Key: file,
            Body: JSON.stringify(value),
        }).promise();
    }

    async list(...prefix) {
        const directory = this.getKey(prefix);
        const result = await this.s3.listObjectsV2({
            Bucket: this.bucket,
            Prefix: directory,
        }).promise();

        const fileData = await Promise.all(result.Contents.map(async f => {
            const data = await this.s3.getObject({
				Bucket: this.bucket,
				Key: f.Key,
			}).promise();
			return JSON.parse(data.Body);
        }));

        return fileData;
    }
}

module.exports = S3Db;