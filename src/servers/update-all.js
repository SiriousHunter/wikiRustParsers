const {connection} = require('../models')
const {getAllServersList, getClaimTokens, updateServersInfo} = require("./methods");

(async () => {
    await connection;

    try {
        const serversList = await getAllServersList();
        const claimTokens = await getClaimTokens();
        const retry = 0;

        await updateServersInfo(serversList, retry, undefined, undefined, claimTokens);
    } catch (error) {
        console.error(error.message);
    }

    console.log('update-all: DONE')
    process.exit()
})();
