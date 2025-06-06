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
                    const des = desc[lang];

                    const path = `${route}${skin.url}`;
                    const alternate = alternateLocales.map(elem => ({
                        hreflang: elem,
                        href: path,
                    }));

                    const data = {
                        path,
                        title: skin.name,
                        description: des,
                        lang,
                        meta: [
                            {type: 'property', property: 'og:title', content: skin.name},
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

                    await models.sitemap.create(data).catch(()=>({}))
                }
            }

            console.log('Skins parsed');
        } catch (err) {
            console.error(err?.request?.path, err.message, err?.response?.data)
        }
    }
}

module.exports = new SCMM();
