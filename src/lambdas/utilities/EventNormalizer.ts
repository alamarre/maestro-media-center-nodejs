
const MAIN_ACCOUNT = process.env.MAIN_ACCOUNT;

const normalize = (event) => {
  return event.Records.map(record => {
    if (record.dynamodb) {
      const partition = record.dynamodb.Keys.partition.S;
      const sort = record.dynamodb.Keys.sort.S;
      let account = partition;
      let table;
      let key;
      if (!partition.match(/^[a-z_]+$/)) {
        const parts = sort.split("/");
        table = parts.shift();
        key = parts.join("/");
      } else {
        account = MAIN_ACCOUNT;
        table = partition;
        key = sort;
      }
      const eventName = record.eventName;
      return { table, key, account, eventName, };
    }

    if (record.Sns) {
      return JSON.parse(record.Sns.Message);
    }

    if (record.body) {
      return JSON.parse(record.body);
    }

    return record;
  });
};

export default normalize;
