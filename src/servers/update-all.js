const {connection} = require('../models')
const mongoose = require("mongoose");
const {getAllServersList, parseServer} = require("./methods");
const {sleep} = require("../utils");

(async () => {
    await connection;

    try {
        const serversList = await getAllServersList();
        const queue = new Set();
        const queueSize = 10;

        console.log(`update-all: Total servers: [${serversList.length}]`);
        while(serversList.length) {
            if(queue.size < queueSize) {
                const address = serversList.pop();
                queue.add(address);

                console.log(`update-all: Left: [${serversList.length}]`)
                new Promise(async (resolve, reject) => {
                    const result = await parseServer(address);

                    const data = {
                        ...result,
                        address,
                    }
                    await mongoose.connection.db.collection('servers')
                        .updateOne({address}, {$set: data}, {upsert: true})
                        .catch(err => console.log(err));

                    queue.delete(address);
                    resolve();
                })
            }
            await sleep(100);
        }
    } catch (error) {
        console.error(error.message);
    }

    console.log('update-all: DONE')
    process.exit()
})();
