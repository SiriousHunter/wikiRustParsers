const Axios = require('axios');
const {connection, models} = require('../models')

const API_URL = 'https://lis-skins.com/';
const MARKET_TYPE = 'rustexplore:lisSkins';
const AFF_CODE = 'rf=2642496';

(async () => {
    await connection;
    const axios = Axios.create({
        baseURL: API_URL,
    })

    try {
        const {data, status} = await axios.get('/market_export_json/rust.json');

        if(status !== 200) {
            console.error(`LIS-SKINS: Get items error. Status: ${status}`);
            return;
        }

        console.log(`LIS-SKINS: ${data.length} skins parsed`);

        for (const skin of data) {
            const updated = await models.skins.updateOne({name: skin.name},{
                $set: {
                    "buyPrices.$[elem].marketType": MARKET_TYPE,
                    "buyPrices.$[elem].acceptedPayments": "Cash",
                    "buyPrices.$[elem].price": skin.price * 100,
                    "buyPrices.$[elem].fee": 0,
                    "buyPrices.$[elem].supply": skin.count,
                    "buyPrices.$[elem].isAvailable": true,
                    "buyPrices.$[elem].url": `${skin.url}?${AFF_CODE}`,
                    "buyPrices.$[elem].updatedTime": new Date(),
                }
            }, {
                arrayFilters: [{ "elem.marketType": {$eq: MARKET_TYPE} }]
            })

            if (updated.modifiedCount === 0 && updated.matchedCount === 1) { // Если ничего не изменилось, добавляем новый элемент
                await models.skins.updateOne(
                    {name: skin.name},
                    { $push: { buyPrices: {
                        "marketType": MARKET_TYPE,
                        "acceptedPayments": "Cash",
                        "price": skin.price * 100,
                        "fee": 0,
                        "supply": skin.count,
                        "isAvailable": true,
                        "url": `${skin.url}?${AFF_CODE}`,
                        "buyPrices.$[elem].updatedTime": new Date(),
                    } } }
                );
            }

            await models.skinsHistory.create({
                name: skin.item,
                timestamp: new Date(),
                market: 'lisSkins',
                buy_price: skin.price * 100,
                stock: skin.count,
            })
        }

        console.log('LIS-SKINS: skins updated');
    } catch (err) {
        console.error(err?.request?.path, err.message, err?.response?.data)
    } finally {
        process.exit();
    }
})();


