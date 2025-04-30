const Axios = require('axios');
const BaseParser = require('../base-parser')

class LisSkins extends BaseParser {
    API_URL = 'https://lis-skins.com/';
    market = 'lisSkins';
    internalMarket = 'rustexplore:lisSkins';
    affCode = 'rf=2642496';

    constructor() {
        super();
    }

    async parseData() {
        const axios = Axios.create({
            baseURL: this.API_URL,
        })

        const {data, status} = await axios.get('/market_export_json/rust.json');

        if(status !== 200) {
            throw new Error(`${this.market}: Get items error. Status: ${status}`);

        }

        console.log(`${this.market}: ${data.length} skins parsed`);

        return data.map(skin => ({
            name: skin.name,
            price: skin.price,
            count: skin.count,
            url: skin.url,
        }))
    }
}

module.exports = new LisSkins();
