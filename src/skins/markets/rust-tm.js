const Axios = require('axios');
const BaseParser = require('../base-parser')

class RustTM extends BaseParser {
    API_URL = 'https://rust.tm';
    market = 'rusttm';
    internalMarket = 'rustexplore:rusttm';

    constructor() {
        super();
    }

    async parseData() {
        const axios = Axios.create({
            baseURL: this.API_URL,
        })

        const {data, status} = await axios.get('/api/v2/prices/USD.json');
        if(status !== 200) {
            throw new Error(`${this.market}: Get items error. Status: ${status}`);

        }

        const {items} = data;

        console.log(`${this.market}: ${items.length} skins parsed`);

        return items.map(skin => ({
            name: skin.market_hash_name,
            price: Number(skin.price),
            count: Number(skin.volume),
            url: `https://rust.tm/?search=${encodeURIComponent(skin.market_hash_name)}`,
        }))
    }
}

module.exports = new RustTM();
