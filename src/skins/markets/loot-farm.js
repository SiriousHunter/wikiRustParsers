const Axios = require('axios');
const BaseParser = require('../base-parser')

class LootFarm extends BaseParser {
    API_URL = 'https://loot.farm';
    market = 'lootfarm';
    internalMarket = 'rustexplore:lootfarm';

    constructor() {
        super();
    }

    async parseData() {
        const axios = Axios.create({
            baseURL: this.API_URL,
        })

        const {data, status} = await axios.get('/fullpriceRUST.json');
        if(status !== 200) {
            throw new Error(`${this.market}: Get items error. Status: ${status}`);

        }

        console.log(`${this.market}: ${data.length} skins parsed`);

        return data.map(skin => ({
            name: skin.name,
            price: skin.price / 100,
            count: skin.have,
            url: `https://loot.farm/`,
        }))
    }
}

module.exports = new LootFarm();
