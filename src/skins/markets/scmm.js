const Axios = require('axios');
const BaseParser = require('../base-parser')
const {getItems} = require('../methods');
const {models} = require('../../models')

const LOCALES = ['ru', 'en'];
const {BASE_URL} = process.env;
const desc = {
    ru: 'Актуальная цена в различных магазинах. Обновляется ежедневно',
    en: 'Current price in various stores. Updated daily',
};

const getDescription = (skin, locale) => {
    const name = skin.name;
    const collection = skin.itemCollection;
    const minPrice = skin.buyNowPrice ? (skin.buyNowPrice / 100).toFixed(2) : null;

    const templates = {
        ru: {
            withPriceAndCollection: `${name} из коллекции ${collection}: цена от ${minPrice}$. Где купить и продать, история цен и подробная информация о скине.`,
            withPriceOnly: `${name}: цена от ${minPrice}$. Где купить и продать, история цен и подробная информация о скине.`,
            withCollectionOnly: `${name} из коллекции ${collection}. Где купить и продать, история цен и подробная информация о скине.`,
            default: `${name}. Где купить и продать, история цен и подробная информация о скине.`
        },
        en: {
            withPriceAndCollection: `${name} from collection ${collection}: price from ${minPrice}$. Where to buy and sell, price history and detailed skin information.`,
            withPriceOnly: `${name}: price from ${minPrice}$. Where to buy and sell, price history and detailed skin information.`,
            withCollectionOnly: `${name} from collection ${collection}. Where to buy and sell, price history and detailed skin information.`,
            default: `${name}. Where to buy and sell, price history and detailed skin information.`
        }
    };

    const localeTemplates = templates[locale] || templates.en;

    if (minPrice && collection) {
        return localeTemplates.withPriceAndCollection;
    } else if (minPrice) {
        return localeTemplates.withPriceOnly;
    } else if (collection) {
        return localeTemplates.withCollectionOnly;
    } else {
        return localeTemplates.default;
    }
}

const getTitle = (skin, locale) => {
    const name = skin.name;
    const minPrice = skin.buyNowPrice ? (skin.buyNowPrice / 100).toFixed(2) : null;

    const templates = {
        ru: {
            withPrice: `${name} - цена от ${minPrice}$`,
            withoutPrice: `${name} - информация о скине`
        },
        en: {
            withPrice: `${name} - price from ${minPrice}$`,
            withoutPrice: `${name} - skin information`
        }
    };

    const localeTemplates = templates[locale] || templates.en;
    return minPrice ? localeTemplates.withPrice : localeTemplates.withoutPrice;
}

class SCMM extends BaseParser {
    API_URL = 'https://rust.scmm.app/api';

    constructor() {
        super();
    }

    async run() {
        const axios = Axios.create({
            baseURL: this.API_URL,
        })
        const route = '/skins/';

        try {
            const items = await getItems(axios)

            for (const skin of items) {
                let createSitemap = true;
                skin.url = skin.name.toLowerCase().trim().replaceAll(' ', '-');

                await models.skins.create(skin)
                    .catch(async err => {
                        if (err.code === 11000) {
                            return models.skins.updateOne({id: skin.id}, skin).catch(() => {});
                        }
                        createSitemap  = false;

                        console.error(err.message, skin.id);

                        return err;
                    });

                for (const lang of LOCALES) {
                    const alternateLocales = LOCALES.filter(elem => elem !== lang);
                    const baseLocaleUrl = lang !== 'en' ? `${BASE_URL}/${lang}` : BASE_URL;

                    const title = getTitle(skin, lang);
                    const des = getDescription(skin, lang);

                    const path = `${route}${skin.url}`;
                    const alternate = alternateLocales.map(elem => ({
                        hreflang: elem,
                        href: path,
                    }));

                    const data = {
                        path,
                        title: title,
                        description: des,
                        lang,
                        meta: [
                            {type: 'property', property: 'og:title', content: title},
                            {type: 'property', property: 'og:description', content: des},
                            {type: 'property', property: 'og:type', content: 'article'},
                            {type: 'property', property: 'og:url', content: `${baseLocaleUrl}${route}${skin.url}`},
                            {type: 'name', property: 'twitter:card', content: 'summary'},
                        ],
                        alternate,
                    };

                    if(skin.previewUrl) {
                        data.image = `${skin.previewUrl}`;
                        data.meta.concat([
                            {type: 'property', property: 'og:image', content: `${skin.previewUrl}`},
                            {type: 'name', property: 'twitter:image', content: `${skin.previewUrl}`},
                        ])
                    }

                    await models.sitemap.updateOne({path: path, lang}, data, {upsert: true}).catch(()=>({}))
                }
            }

            console.log('Skins parsed');
        } catch (err) {
            console.error(err?.request?.path, err.message, err?.response?.data)
        }
    }
}

module.exports = new SCMM();
