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
                    "buyPrices.$[elem].price": skin.price * 100,
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
                        "price": skin.price * 100,
                        "fee": 0,
                        "supply": skin.count,
                        "isAvailable": true,
                        "url": `${skin.link}&${AFF_CODE}`,
                        "buyPrices.$[elem].updatedTime": new Date(),
                    } } }
                );
            }

            await models.skinsHistory.create({
                name: skin.item,
                timestamp: new Date(),
                market: 'tradeit',
                buy_price: skin.price * 100,
                trade_sell_price: skin.depositPrice,
                trade_buy_price: skin.withdrawPrice,
                stock: skin.count,
            })
        }

        console.log('TRADEIT: skins updated');
    } catch (err) {
        console.error(err?.request?.path, err.message, err?.response?.data)
    } finally {
        process.exit();
    }
})();


