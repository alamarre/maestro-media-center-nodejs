class UserQueue {
    constructor() {
        this.messages = [];
    }

    async getMessages(max = 1, timeout = 2000) {
        return new Promise((s) => {
            if(this.messages.length >= 1) {
                const messages = this.messages.splice(0, max);
                return s(messages);
            }
            this.success = s;
            this.timeout = setTimeout(() => {
                this.timeout = null;
                this.success = null;
                s([]);
            }, timeout);
        });
    }

    async sendMessage(messageBody) {
        if(this.timeout) {
            clearTimeout(this.timeout);
            this.timeout = null;
        }
        
        if(this.success) {
            this.success([messageBody,]);
            this.success = null;
        } else {
            this.messages.push(messageBody);
        }
    }
}

module.exports = UserQueue;