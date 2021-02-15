import IDatabase from "../IDatabase";

const cleanup = function <T>(dynamoItem: object): T {
  const newResult = {};
  for (const key in dynamoItem) {
    if (typeof dynamoItem[key] === "object") {
      newResult[key] = dynamoItem[key].values;
    } else {
      newResult[key] = dynamoItem[key];
    }
  }
  newResult["key"] = `${newResult["partition"]}/${newResult["sort"]}`;
  delete newResult["partition"];
  delete newResult["sort"];
  return newResult as T;
}

export default class DynamoDb implements IDatabase {
  constructor(private dynamoDocClient, private table, private prefix) {
  }

  getKey(pathParts) {
    const partition = this.prefix || pathParts.shift();
    const sort = pathParts.join("/");
    return { partition, sort, };
  }


  async get<T>(...pathParams: string[]): Promise<T> {
    const key = this.getKey(pathParams);
    try {
      const result = await this.dynamoDocClient.get({
        Key: key,
        TableName: this.table,
      }).promise();
      if (!result.Item) {
        return null;
      }
      return cleanup<T>(result.Item);
    }
    catch (e) {
      return null;
    }
  }

  async set<T>(value: T, ...pathParams: string[]): Promise<void> {
    for (const key of Object.keys(value)) {
      if (!value[key]) {
        delete value[key];
      }
    }
    const key = this.getKey(pathParams);
    await this.dynamoDocClient.put({
      TableName: this.table,
      Item: Object.assign(key, value),
    }).promise();
  }

  async addIfNotExists<T>(value: T, ...pathParams: string[]): Promise<void> {
    for (const key of Object.keys(value)) {
      if (!value[key]) {
        delete value[key];
      }
    }
    const key = this.getKey(pathParams);
    await this.dynamoDocClient.put({
      TableName: this.table,
      Item: Object.assign(key, value),
      ConditionExpression: 'attribute_not_exists(#p)',
      ExpressionAttributeNames: {
        "#p": "partition",
      },
    }).promise();
  }

  async delete(...pathParams: string[]): Promise<void> {
    const key = this.getKey(pathParams);
    await this.dynamoDocClient.delete({
      TableName: this.table,
      Key: key,
    }).promise();
  }

  async addToStringSet(values: string[], column: string, ...pathParams: string[]): Promise<void> {
    const key = this.getKey(pathParams);
    await this.dynamoDocClient.update({
      TableName: this.table,
      Key: key,
      UpdateExpression: `ADD ${column} :value`,
      ExpressionAttributeValues: {
        ":value": this.dynamoDocClient.createSet(values),
      },
    }).promise();
  }

  async removeStringFromSet(values: string[], column: string, ...pathParams: string[]): Promise<void> {
    const key = this.getKey(pathParams);
    await this.dynamoDocClient.update({
      TableName: this.table,
      Key: key,
      UpdateExpression: `DELETE ${column} :value`,
      ExpressionAttributeValues: {
        ":value": this.dynamoDocClient.createSet(values),
      },
    }).promise();
  }

  async list<T>(...prefix: string[]): Promise<T[]> {
    const partition = prefix.shift();
    const sortKey = prefix.join("/") + "/";
    let result;
    if (prefix.length === 0) {
      result = await this.dynamoDocClient.query({
        TableName: this.table,
        KeyConditionExpression: "#p = :partition",
        ExpressionAttributeNames: {
          "#p": "partition",
        },
        ExpressionAttributeValues: {
          ":partition": partition,
        },
      }).promise();
    } else {
      result = await this.dynamoDocClient.query({
        TableName: this.table,
        KeyConditionExpression: "#p = :partition and begins_with(sort, :sortKey)",
        ExpressionAttributeNames: {
          "#p": "partition",
        },
        ExpressionAttributeValues: {
          ":partition": partition,
          ":sortKey": sortKey,
        },
      }).promise();
    }

    return result.Items.map(i => cleanup<T>(i));
  }
}
