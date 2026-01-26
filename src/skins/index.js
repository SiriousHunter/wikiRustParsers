const {connection} = require('../models')

const Avan = require('./markets/avan');
const LisSkins = require('./markets/lis-skins');
const Tradeit = require('./markets/tradeit');
const SCMM = require('./markets/scmm');
const SteamStore = require('./markets/steamstore');
const Waxpeer = require('./markets/waxpeer');
const RustTm = require('./markets/rust-tm');
const LootFarm = require('./markets/loot-farm');
const SkinsMonitoring = require('./markets/skins-monitoring');

(async () => {
    await connection;

    await SCMM.run()
    await Avan.run()
    await LisSkins.run()
    await Tradeit.run()
    await SteamStore.run()
    await Waxpeer.run()
    await RustTm.run()
    await LootFarm.run()
    await SkinsMonitoring.run()
    await SteamStore.run()

    process.exit()
})();


