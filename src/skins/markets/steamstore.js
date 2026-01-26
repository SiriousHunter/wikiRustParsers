const Axios = require('axios');
const cheerio = require('cheerio');
const BaseParser = require('../base-parser')
const {getItems} = require('../methods');
const {models} = require('../../models')

class SteamStore extends BaseParser {
    API_URL = 'https://store.steampowered.com/itemstore/252490';
    market = 'SteamStore';
    internalMarket= 'SteamStore'

    constructor() {
        super();
    }

    async parseData() {
        const axios = Axios.create({
            baseURL: this.API_URL,
        })

        const {data, status} = await axios.get('/browse/?filter=Limited&cc=us');

        if(status !== 200) {
            throw new Error(`${this.market}: Get items error. Status: ${status}`);
        }

        const parser = cheerio.load(data);
        const items = [];

        parser('.item_def_grid_item').each((_, el) => {
            const name = parser(el).find('.item_def_name').text().trim();
            const price = parser(el).find('.item_def_price').text().trim().slice(1);
            const url = parser(el).find('a').attr('href');

            name && price && items.push({ name, price: Number(price), url });
        });

        console.log(`${this.market}: ${items.length} skins parsed`);

        return items;
    }

    async savePrice(skins) {
        for(const skin of skins) {
            const {name, market, price, url} = skin;

            const updatedSkin = await models.skins.updateOne({name: name, prices: {$exists: true}},{
                $set: {
                    "prices.$[elem].market": this.market,
                    "prices.$[elem].buyPrice": price,
                    "prices.$[elem].fee": 0,
                    "prices.$[elem].isAvailable": true,
                    "prices.$[elem].url": url,
                    "prices.$[elem].updated": new Date(),
                }
            }, {
                arrayFilters: [{ "elem.market": {$eq: market} }]
            })

            if (updatedSkin.modifiedCount === 0) { // Если ничего не изменилось, добавляем новый элемент
                await models.skins.updateOne(
                    {name: name}, {
                        $push: {
                            prices: {
                                market: this.market,
                                buyPrice: price,
                                url,
                                isAvailable: true,
                                updated: new Date(),
                            }
                        }
                    });
            }
        }
    }
}

module.exports = new SteamStore();
