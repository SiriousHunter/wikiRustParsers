const {connection} = require('../models')

const Avan = require('./markets/avan');
const LisSkins = require('./markets/lis-skins');
const Tradeit = require('./markets/tradeit');
const SCMM = require('./markets/scmm');
const SteamStore = require('./markets/steamstore');
const Waxpeer = require('./markets/waxpeer');

(async () => {
    await connection;

    await SCMM.run()
    await Avan.run()
    await LisSkins.run()
    await Tradeit.run()
    await SteamStore.run()
    await Waxpeer.run()

    process.exit()
})();


