const {queryMasterServer,REGIONS} = require('steam-server-query');
const {GameDig} = require("gamedig");
const {sleep} = require("../utils");
const mongoose = require("mongoose");

const APP_ID = 252490;
const SLEEP_TIME = 10000;

async function parseServersList() {
    let servers;

    try {
        servers = await queryMasterServer(
            'hl2master.steampowered.com:27011',
            REGIONS.ALL,
            {empty: 1, password: 1, secure: 1, dedicated: 1, appid: APP_ID },
            SLEEP_TIME,
        )
    } catch (error) {
        console.error(error.message);
        // await sleep(SLEEP_TIME)

        // servers = await parseServersList(region);?
    }

    return servers;
}

async function parseServer(server){
    try {
        const [address, port] = server.split(':');
        const data = await GameDig.query({
            type: 'rust',
            address,
            port,
            maxRetries: 10,
            requestRules: true
        })

        return data;
    } catch(err){
        console.error(err.message);
    }

    return;
}

async function getAllServersList(){
    try {
        const data = await mongoose.connection.db.collection('servers_list').find({}).toArray();

        return data.map(({address}) => address);
    } catch(err){
        console.error(err.message);
    }

    return;
}


module.exports = {
    getAllServersList,
    parseServersList,
    parseServer
}
