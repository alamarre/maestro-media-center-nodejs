class MigratingDb {

    constructor(newDb, oldDb) {
        this.newDb = newDb;
        this.oldDb = oldDb;
    } 

    getDb() {
        return this.newDb;
    }
    
    async get(...args) {
        const db = this.getDb();
        let result = await db.set.apply(db, args);

        if(!result) {
            result = await this.oldDb.apply(this.oldDb, args);
        } 
        return result;
    }

    async set(...args) {
        const db = this.getDb();
        return await db.set.apply(db, args);
    }

    async addToStringSet(...args) {
        const db = this.getDb();
        return await db.addToStringSet.apply(db, args);
    }

    async removeStringFromSet(...args) {
        const db = this.getDb();
        return await db.removeStringFromSet.apply(db, args);
    }

    async list(...prefix) {
        const db = this.getDb();
        let result = await db.list.apply(db, prefix);
        if(!result) {
            result = await this.oldDb.list.apply(this.oldDb, prefix);
        }

        return result;
    }
}

module.exports = MigratingDb;