const Axios = require('axios');
const BaseParser = require('../base-parser')

class Tradeit extends BaseParser {
    API_URL = 'https://api.tradeit.gg';
    market = 'tradeit';
    internalMarket = 'rustexplore:tradeit';
    affCode = 'aff=RustExplore';

    constructor() {
        super();
    }

    async parseData() {
        const axios = Axios.create({
            baseURL: this.API_URL,
        })

        const {data, status} = await axios.get('/items/252490');

        if(status !== 200) {
            throw new Error(`${this.market}: Get items error. Status: ${status}`);

        }

        console.log(`${this.market}: ${data.length} skins parsed`);

        return data.map(skin => ({
            name: skin.item,
            price: skin.price,
            count: skin.count,
            url: skin.link,
        }))
    }
}

module.exports = new Tradeit();
