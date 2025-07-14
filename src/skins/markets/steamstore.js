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

            items.push({ name, price: Number(price), url });
        });

        console.log(`${this.market}: ${items.length} skins parsed`);

        return items;
    }
}

module.exports = new SteamStore();
