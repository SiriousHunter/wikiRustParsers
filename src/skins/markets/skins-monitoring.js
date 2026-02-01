const Axios = require('axios');
const BaseParser = require('../base-parser')
const {getItems} = require('../methods');
const {models} = require('../../models')
const mongoose = require("mongoose");

const LOCALES = ['ru', 'en'];
const {BASE_URL} = process.env;

class SkinsMonitoring extends BaseParser {
    API_URL = 'http://89.125.63.75:3333/api';

    constructor() {
        super();
    }

    async run() {
        const axios = Axios.create({
            baseURL: this.API_URL,
        })
        const route = '/prices';

        try {
            const {data} = await axios.get(route)
            const prices = data?.prices || [];

            await this.#saveHistory(prices);
            await this.#savePrices(prices);

            console.log('SKINS MONITORING parsed');
        } catch (err) {
            console.error(err?.request?.path, err.message, err?.response?.data)
        }
    }

    async #savePrices(skins) {
        for (const skin of skins) {
            const {name, markets} = skin;
            const buyPrices = []

            for (const market of markets) {
                const {
                    mN: marketName,
                    lBP: buyPrice,
                    lSt: stock,
                    lSP: sellPrice,
                    lTs: timestamp,
                } = market;
                const url = this.getUrl(marketName, name);

                if (!url) continue;


                buyPrice && Number(stock) !== 0 && buyPrices.push({
                    market: marketName,
                    stock,
                    url,
                    buyPrice: buyPrice / 100,
                    ...sellPrice > 0 && {sellPrice: sellPrice / 100},
                    ...timestamp && {updated: new Date(Number(timestamp))},
                })
            }

            buyPrices.length && await this.#saveBuyPrices(name, buyPrices);
        }
    }

    getUrl(marketType, name) {
        const encodedName = encodeURIComponent(name);
        const escapedItemName = name.replaceAll(' ', '-').toLowerCase();
        const escapedItemNameWithPlus = name.replaceAll(' ', '+').toLowerCase();
        const fullEscapedName = escapedItemName.replaceAll('\'', '').toLowerCase();
        const fullEscapedNameWithPlus = escapedItemNameWithPlus.replaceAll('\'', '').toLowerCase();

        switch (marketType) {
            case 'avan':
              return `https://avan.market/en/market/rust/${escapedItemName}?r=RustExplore&currency=1`
            case 'steam':
              return `https://steamcommunity.com/market/listings/252490/${name}`;
            case 'lisSkins':
              return `https://lis-skins.com/ru/market/rust/${escapedItemName}?rf=2642496`;
            case 'csDeals':
              // return `https://cs.deals/new/market?game=rust&sort=newest&sort_desc=1&name=${fullEscapedNameWithPlus}&exact_match=0`;
              return 'https://csdeals.com/new/?ref=nde3mzr'
            case 'rustSkins':
              return `https://rustskins.com/rust/item/${escapedItemName}?r=rustexplore`;
            // case 'skinport':
            //   return `https://skinport.com/ru/rust/item/${fullEscapedName}`;
            case 'tradeIt':
              return `https://tradeit.gg/ru/rust/store?search=${name}&aff=RustExplore`;
            case 'waxpeer':
              return `https://waxpeer.com/r/rexplore?game=rust&sort=ASC&order=price&all=0&exact=0&search=${name}`;
            case 'rustTM':
              return `https://rust.tm/?t=all&search=${encodedName}&sd=desc`;
            case 'lootFarm':
              return `https://loot.farm/`;
            default:
              return null;
          }
    }

    async #saveHistory(skins) {
        const data = [];

        for (const skin of skins) {
            const {name, markets} = skin;

            for (const market of markets) {
                const {
                    mN: marketName,
                    lTs: timestamp,
                    lBP: price,
                    lSt: stock,
                } = market;

                if ((Date.now() - new Date(Number(timestamp))) / 60000 <= 10) {
                    data.push({
                        name,
                        market: marketName,
                        price: price / 100,
                        stock: Number(stock),
                        timestamp: new Date(Number(timestamp)),
                    });
                }
            }
         }

        await mongoose.connection.db.collection('skinsprices').insertMany(data)
    }

    async #saveBuyPrices(name, buyPrices) {

        for (const price of buyPrices) {
            const {market, buyPrice, sellPrice, stock, url, updated = new Date()} = price;

            const updatedSkin = await models.skins.updateOne({name: name, prices: {$exists: true}},{
                $set: {
                    "prices.$[elem].market": market,
                    "prices.$[elem].buyPrice": buyPrice,
                    "prices.$[elem].sellPrice": sellPrice,
                    "prices.$[elem].fee": 0,
                    "prices.$[elem].stock": stock,
                    "prices.$[elem].isAvailable": true,
                    "prices.$[elem].url": url,
                    "prices.$[elem].updated": updated,
                }
            }, {
                arrayFilters: [{ "elem.market": {$eq: market} }]
            })

            if (updatedSkin.modifiedCount === 0) { // Если ничего не изменилось, добавляем новый элемент
                await models.skins.updateOne(
                    {name: name}, {
                        $push: {
                            prices: {
                                market,
                                buyPrice,
                                sellPrice,
                                stock,
                                url,
                                updated,
                            }
                        }
                    });
            }
        }

    }
}

module.exports = new SkinsMonitoring();
