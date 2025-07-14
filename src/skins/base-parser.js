const {models} = require("../models");
const mongoose = require("mongoose");
class BaseParser {
    affCode;
    market;
    internalMarket;


    constructor(options) {}

    async run(){
        try {
            const data = await this.parseData();

            await this.savePrice(data);
            await this.saveHistory(data);
        } catch (error) {
            console.error(error);
        }
    }

    async parseData() {
        throw new Error('Not implemented');
    }

    async savePrice(skins) {
        for(const skin of skins) {
            const {
                name,
                price,
                count,
                url,
            } = skin;

            const updated = await models.skins.updateOne({name: name},{
                $set: {
                    "buyPrices.$[elem].marketType": this.internalMarket,
                    "buyPrices.$[elem].acceptedPayments": "Cash",
                    "buyPrices.$[elem].price": price * 100,
                    "buyPrices.$[elem].fee": 0,
                    "buyPrices.$[elem].supply": count,
                    "buyPrices.$[elem].isAvailable": true,
                    "buyPrices.$[elem].url": this.dontUseAff ? url :`${url}?${this.affCode}`,
                    "buyPrices.$[elem].updatedTime": new Date(),
                }
            }, {
                arrayFilters: [{ "elem.marketType": {$eq: this.internalMarket} }]
            })

            if (updated.modifiedCount === 0 && updated.matchedCount === 1) { // Если ничего не изменилось, добавляем новый элемент
                await models.skins.updateOne(
                    {name: name}, {
                        $push: {
                            buyPrices: {
                                "marketType": this.internalMarket,
                                "acceptedPayments": "Cash",
                                "price": price * 100,
                                "fee": 0,
                                "supply": count,
                                "isAvailable": true,
                                "url": this.dontUseAff ? url :`${url}?${this.affCode}`,
                                "buyPrices.$[elem].updatedTime": new Date(),
                            }
                        }
                    });
            }
        }
    }

    async saveHistory(skins) {
        const data = skins.map(skin => ({
                name: skin.name,
                price: skin.price,
                stock: skin.count,
                market: this.market,
                timestamp: new Date(),
        }));

        await mongoose.connection.db.collection('skinsprices').insertMany(data)
    }
}

module.exports = BaseParser;
