const Axios = require('axios');
const BaseParser = require('../base-parser')

class Waxpeer extends BaseParser {
    API_URL = 'https://api.waxpeer.com';
    market = 'waxpeer';
    internalMarket = 'rustexplore:waxpeer';
    affCode = 'aff=rexplore';
    dontUseAff = true

    constructor() {
        super();
    }

    async parseData() {
        const axios = Axios.create({
            baseURL: this.API_URL,
        })

        const {data, status} = await axios.get('/v1/prices?game=rust&minified=1&single=0');

        if(status !== 200) {
            throw new Error(`${this.market}: Get items error. Status: ${status}`);
        }

        const {items} = data;

        console.log(`${this.market}: ${items.length} skins parsed`);

        return items.map(skin => ({
            name: skin.name,
            price: skin.min / 1000,
            count: skin.count,
            url: `https://waxpeer.com/r/rexplore?game=rust&sort=ASC&order=price&all=0&exact=0&search=${skin.name}`,
        }))
    }
}

module.exports = new Waxpeer();
