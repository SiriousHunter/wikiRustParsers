const Axios = require('axios');
const {connection, models} = require('../models')

const API_URL = 'https://api.tradeit.gg';
const MARKET_TYPE = 'rustexplore:tradeit';
const AFF_CODE = 'aff=RustExplore';

(async () => {
    await connection;
    const axios = Axios.create({
        baseURL: API_URL,
    })

    try {
        const {data, status} = await axios.get('/items/252490');

        if(status !== 200) {
            console.error(`TRADEIT: Get items error. Status: ${status}`);
            return;
        }

        console.log(`TRADEIT: ${data.length} skins parsed`);

        for (const skin of data) {
            const updated = await models.skins.updateOne({name: skin.item},{
                $set: {
                    "buyPrices.$[elem].marketType": MARKET_TYPE,
                    "buyPrices.$[elem].acceptedPayments": "Cash",
                    "buyPrices.$[elem].price": skin.price * 1000,
                    "buyPrices.$[elem].fee": 0,
                    "buyPrices.$[elem].supply": skin.count,
                    "buyPrices.$[elem].isAvailable": true,
                    "buyPrices.$[elem].url": `${skin.link}&${AFF_CODE}`,
                    "buyPrices.$[elem].updatedTime": new Date(),
                }
            }, {
                arrayFilters: [{ "elem.marketType": {$eq: MARKET_TYPE} }]
            })

            if (updated.modifiedCount === 0 && updated.matchedCount === 1) { // Если ничего не изменилось, добавляем новый элемент
                await models.skins.updateOne(
                    {name: skin.item},
                    { $push: { buyPrices: {
                        "marketType": MARKET_TYPE,
                        "acceptedPayments": "Cash",
                        "price": skin.price,
                        "fee": 0,
                        "supply": skin.count,
                        "isAvailable": true,
                        "url": `${skin.link}&${AFF_CODE}`,
                        "buyPrices.$[elem].updatedTime": new Date(),
                    } } }
                );
            }

        }

        console.log('TRADEIT: skins updated');
    } catch (err) {
        console.error(err?.request?.path, err.message, err?.response?.data)
    } finally {
        process.exit();
    }
})();


