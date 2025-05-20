const Axios = require('axios');
const BaseParser = require('../base-parser')

class Avan extends BaseParser {
    API_URL = 'https://avanprice.avan.market';
    market = 'avan';
    internalMarket = 'rustexplore:avan';
    affCode = 'r=RustExplore';

    constructor() {
        super();
    }

    async parseData() {
        const axios = Axios.create({
            baseURL: this.API_URL,
        })

        const {data: result, status} = await axios.get('/listening-catalog/rust');
        if(status !== 200) {
            throw new Error(`${this.market}: Get items error. Status: ${status}`);

        }

        const {data} = result;

        console.log(`${this.market}: ${data.length} skins parsed`);

        return data.map(skin => ({
            name: skin.full_name,
            price: skin.price,
            count: skin.count,
            url: skin.link,
        }))
    }
}

module.exports = new Avan();
