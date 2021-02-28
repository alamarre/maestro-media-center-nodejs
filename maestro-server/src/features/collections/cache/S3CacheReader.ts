const DB_BUCKET = process.env.DB_BUCKET;
const OBJECT_NAME = "video/cache.json"
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import Folder from "./Folder";

const client = new S3Client({});

// from: https://stackoverflow.com/questions/10623798/how-do-i-read-the-contents-of-a-node-js-stream-into-a-string-variable (Marlon Bernardes)
function streamToString(stream) {
  const chunks = [];
  return new Promise((resolve, reject) => {
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('error', (err) => reject(err));
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
  })
}

export default class S3CacheReader {
  async getFolderFromPath(path = null): Promise<Folder> {
    const cache = await this.getCache();

    if (!path) {
      return cache;
    }

    if (path.startsWith("/")) {
      path = path.substring(1);
    }
    const parts = path.split("/");
    let current = cache;
    for (let i = 0; i < parts.length; i++) {
      if (!current.folders[parts[i]]) {
        return null;
      }
      current = current.folders[parts[i]];
    }
    return current;
  }

  private async getCache(): Promise<Folder> {
    const data = await client.send(new GetObjectCommand({ Bucket: DB_BUCKET, Key: OBJECT_NAME }));
    const body: string = await streamToString(data.Body) as string;
    return JSON.parse(body);
  }
}
