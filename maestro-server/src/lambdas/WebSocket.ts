import AWS = require("aws-sdk");
//patch for aws-sdk in AWS not containing the latest API Gateway code
require("./WebsocketApiGatewayPatch");

const DYNAMO_TABLE = process.env.DYNAMO_TABLE || "maestro-media-center";
const dynamoClient = new AWS.DynamoDB.DocumentClient();
const DynamoDb = require("../impl/aws/DynamoDb");
const db = new DynamoDb(dynamoClient, DYNAMO_TABLE);

const SimplePasswordAuth = require("../impl/local/SimplePasswordAuth");
const userManager = new SimplePasswordAuth(db);

let send = undefined;
function init(event) {
  const apigwManagementApi = new AWS.ApiGatewayManagementApi({
    apiVersion: "2018-11-29",
    endpoint: event.requestContext.domainName + "/" + event.requestContext.stage,
  });
  send = async (connectionId, data) => {
    await apigwManagementApi.postToConnection({ ConnectionId: connectionId, Data: data, }).promise();
  };
}

exports.handler = async (event) => {
  init(event);
  const connectionId = event.requestContext.connectionId;

  console.log(JSON.stringify(event));
  try {
    if (event.requestContext.eventType == "DISCONNECT") {
      const listenerInfo = await db.get("listener-connections", connectionId);
      if (listenerInfo) {
        await db.delete(listenerInfo.accountId, "listening-websockets", listenerInfo.username, listenerInfo.id);
        await db.delete("listener-connections", connectionId);
      }

      const senderInfo = await db.get("sender-connections", connectionId);
      if (senderInfo) {
        await db.delete(senderInfo.accountId, "sender-websockets", senderInfo.username, connectionId);
        await db.delete("sender-connections", connectionId);
      }
    }

    const message = JSON.parse(event.body);
    const token = message.token;

    const user = await userManager.getUser(token);
    const accountId = user.accountId || process.env.MAIN_ACCOUNT;
    const username = user.username;

    if (message.action == "setId") {
      const { id, } = message;
      const listenerInfo = await db.get("listener-connections", connectionId);
      if (listenerInfo) {
        await db.delete(listenerInfo.accountId, "listening-websockets", listenerInfo.username, listenerInfo.id);
        await db.delete("listener-connections", connectionId);
      }
      // store in dynamo
      await db.set({ id, connectionId, }, accountId, "listening-websockets", username, id);
      // alert all connected devices for user

      const results = await db.list(accountId, "listening-websockets", username);
      await db.set({ connectionId, accountId, username, id }, "listener-connections", connectionId);
      const ids = results.map(r => r.id);
      const senders = await db.list(accountId, "sender-websockets", username);
      for (const sender of senders) {
        try {
          await send(sender.connectionId, JSON.stringify({ "action": "list", ids, }));
        } catch (e) {
          if (e.message.indexOf("GoneException") > -1) {
            console.log("deleting websocket that's gone");
            await db.delete(accountId, "sender-websockets", username, sender.connectionId);
          }
        }
      }
    } else if (message.action == "deregister") {
      const { id, } = message;
      // remove from dynamo
      await db.delete(accountId, "listening-websockets", username, id);
      // alert all connected devices
      const results = await db.list(accountId, "listening-websockets", username);
      const ids = results.map(r => r.id);
      const senders = await db.list(accountId, "sender-websockets", username);
      for (const sender of senders) {
        try {
          await send(sender.connectionId, JSON.stringify({ "action": "list", ids, }));
        } catch (e) {
          if (e.message.indexOf("GoneException") > -1) {
            console.log("deleting websocket that's gone");
            await db.delete(accountId, "sender-websockets", username, sender.connectionId);
          }
        }
      }
    } else if (message.client) {
      const { client, } = message;
      // lookup connection for client in Dynamo
      const result = await db.get(accountId, "listening-websockets", username, client);
      // send the message to the specific client
      await send(result.connectionId, JSON.stringify(message));

      await send(connectionId, message);
    } else if (message.action == "list") {
      await db.set({ connectionId, }, accountId, "sender-websockets", username, connectionId);
      await db.set({ connectionId, accountId, username }, "sender-connections", connectionId);
      const results = await db.list(accountId, "listening-websockets", username);
      const ids = results.map(r => r.id);
      await send(connectionId, JSON.stringify({ "action": "list", ids, }));
    }
  } catch (e) {
    console.error(e);
  }

  // the return value is ignored when this function is invoked from WebSocket gateway
  return {};
};
