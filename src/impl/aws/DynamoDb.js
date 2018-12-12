function cleanup(dynamoItem) {
    const newResult = {};
    for(const key in dynamoItem) {
        if(typeof dynamoItem[key] === "object") {
            newResult[key] = dynamoItem[key].values;
        } else {
            newResult[key] = dynamoItem[key];
        }
    }

    return newResult;
}

class DynamoDb {
    constructor(dynamoDocClient, table) {
        this.dynamoDocClient = dynamoDocClient;
        this.table = table;
    }
    getKey(pathParts) {
        const partition = pathParts.shift();
        const sort = pathParts.join("/");
        return {partition, sort,};
    }
    

    async get(...pathParams) {
        const key = this.getKey(pathParams);
        try {
            const result = await this.dynamoDocClient.get({
                Key: key,
                TableName: this.table,
            }).promise();
            return cleanup(result.Item);
         }
         catch(e) {
             return null;
         }
    }

    async set(value, ...pathParams) {
        const key = this.getKey(pathParams);
        await this.dynamoDocClient.put({
            TableName: this.table,
            Item: Object.assign(key, value),
        }).promise();
    }

    async addToStringSet(values, column, ...pathParams) {
        const key = this.getKey(pathParams);
        await this.dynamoDocClient.update({
            TableName: this.table,
            Key: key,
            UpdateExpression : `ADD ${column} :value`,
            ExpressionAttributeValues : {
            ":value" : this.dynamoDocClient.createSet(values),
            },
        }).promise();
    }

    async removeStringFromSet(values, column, ...pathParams) {
        const key = this.getKey(pathParams);
        await this.dynamoDocClient.update({
            TableName: this.table,
            Key: key,
            UpdateExpression : `DELETE ${column} :value`,
            ExpressionAttributeValues : {
            ":value" : this.dynamoDocClient.createSet(values),
            },
        }).promise();
    }

    async list(...prefix) {
        const partition = prefix.shift();
        const sortKey = prefix.join("/")+"/";
        const result = await this.dynamoDocClient.query({
            TableName: this.table,
            KeyConditionExpression: "partion = :partition and begins_with(sort, :sortKey)",
            ExpressionAttributeValues: {
                ":partition": partition,
                ":sortKey": sortKey,
            },
        }).promise();

        return result.Items.map(i => cleanup(i));
    }
}

module.exports = DynamoDb;