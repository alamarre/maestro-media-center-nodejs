const UserQueueManager = require("../src/impl/local/UserQueueManager");

const userQueueManager = new UserQueueManager();

function assert(x) {
    if(!x) {
        throw new Error();
    }
}
async function run() {
    await userQueueManager.getMessages("al");

    await userQueueManager.sendMessage("al", {"message": "hello",});
    let messages = await userQueueManager.getMessages("al");
    assert(messages.length === 1);

    const waitForIt = userQueueManager.getMessages("al");
    await userQueueManager.sendMessage("al", {"message": "hello",});
    messages = await waitForIt;

    assert(messages.length === 1);

    await userQueueManager.sendMessage("al", {"message": "hello",});

    setTimeout(async () => {
        const messages = await userQueueManager.getMessages("al");
        assert(messages.length === 0);
    }, 1000);
    
}

run().catch(e => {
    console.error(e);
    process.exit(1);
});
