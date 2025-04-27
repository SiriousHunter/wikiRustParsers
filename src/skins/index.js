const {connection} = require('../models')

const Avan = require('./markets/avan');
const LisSkins = require('./markets/lis-skins');
const Tradeit = require('./markets/tradeit');
const SCMM = require('./markets/scmm');

(async () => {
    await connection;

    await SCMM.run()
    await Avan.run()
    await LisSkins.run()
    await Tradeit.run()

    process.exit()
})();


