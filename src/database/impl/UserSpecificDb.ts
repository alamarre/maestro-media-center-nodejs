const als = require("async-local-storage");
import IDatabase from "../IDatabase";


export default class UserSpecificDb implements IDatabase {
    constructor(private key) {
        this.key = key || "db";
    }

    getDb() : IDatabase {
        return als.get(this.key) as IDatabase;
    }
    
    async get<T>(...args : string[]) : Promise<T> {
        const db = this.getDb();
        const result = await db.get(...args) as T;
        return result;
    }

    async set<T>(value : T, ...args: string[]) : Promise<void> {
        const db = this.getDb();
        return await db.set<T>(value, ...args);
    }

    async delete(...args: string[]) : Promise<void> {
        const db = this.getDb();
        return await db.delete(...args);
    }

    async addToStringSet(values : string[], column: string, ...pathParams: string[]) : Promise<void> {
        const db = this.getDb();
        return await db.addToStringSet(values, column, ...pathParams);
    }

    async removeStringFromSet(values : string[], column: string, ...pathParams: string[]) : Promise<void> {
        const db = this.getDb();
        return await db.removeStringFromSet(values, column, ...pathParams);
    }

    async list<T>(...prefix: string[]) : Promise<T[]> {
        const db = this.getDb();
        return await db.list(...prefix);
    }
}