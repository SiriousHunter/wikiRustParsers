const {connection} = require('../models')
const mongoose = require("mongoose");
const {parseServersList} = require("./methods");

(async () => {
    await connection;

    try {
        const serversList = await parseServersList();

        if (serversList) {
            await mongoose.connection.db.collection('servers_lists')
                .insertMany(serversList.map(address => ({address, nextUpdate: new Date})), {ordered: false});
        }

    } catch (error) {
        console.error(`update-list: Inserted: [${error.insertedCount}] `);
    }

    console.log('update-list: DONE');
    process.exit()
})();
