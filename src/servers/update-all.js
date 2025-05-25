const {connection} = require('../models')
const {getAllServersList, updateServersInfo} = require("./methods");

(async () => {
    await connection;

    try {
        const serversList = await getAllServersList();
        const retry = 2;

        console.log(`update-all: Total servers: [${serversList.length}]`);
        await updateServersInfo(serversList, retry);

    } catch (error) {
        console.error(error.message);
    }

    console.log('update-all: DONE')
    process.exit()
})();
