const UserQueue = require("./UserQueue");

const MAX_AGE_SECONDS = 1;
const DEVICE_STALE_TIME_SECONDS = 20;

class UserQueueManager {
    constructor() {
        this.userQueues = {};
    }

    async getDevices(user) {
        const time = new Date().getTime();
        if(!this.userQueues[user]) {
            return [];
        }
        return Object.keys(this.userQueues[user])
        .filter(device => time - this.userQueues[user][device].lastRead < DEVICE_STALE_TIME_SECONDS * 1000);
    }

    async getMessages(user, device) {
        if(!this.userQueues[user]) {
            this.userQueues[user] = {};
        }
        if(!this.userQueues[user][device]) {
            this.userQueues[user][device] = new UserQueue();
        }

        const queue = this.userQueues[user][device];
        const time = new Date().getTime();
        queue.lastRead = time;

        let messages = await queue.getMessages(1);
        if(messages.length > 0) {
            
            messages = messages
                .filter(m => time - m.created.getTime() < MAX_AGE_SECONDS * 1000)
                .map(m => m.messageBody);
        }
        return messages;
    }

    async sendMessage(user, device, messageBody) {
        if(!this.userQueues[user]) {
            this.userQueues[user] = {};
        }
        if(!this.userQueues[user][device]) {
            this.userQueues[user][device] = new UserQueue();
        }

        const queue = this.userQueues[user][device];

        queue.sendMessage({created: new Date(), messageBody,});
    }
}

module.exports = UserQueueManager;