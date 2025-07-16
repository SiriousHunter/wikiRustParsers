const {connection} = require('../models')
const mongoose = require("mongoose");
const {parseServersList, parseServersInfo} = require("./methods");

(async () => {
    await connection;

    try {
        const serversList = await parseServersList();
        const servers = await parseServersInfo(serversList);

        if (servers.length) {
            await mongoose.connection.db.collection('servers_lists')
                .insertMany(servers.map(elem => ({...elem, nextUpdate: new Date})), {ordered: false});
        }

    } catch (error) {
        console.error(`update-list: Inserted: [${error.insertedCount}] `);
    }

    console.log('update-list: DONE');
    process.exit()
})();
