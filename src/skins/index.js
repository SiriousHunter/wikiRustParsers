const Axios = require('axios');
const {connection, models} = require('../models')
const API_URL = 'https://rust.scmm.app/api';

const {
    getItems,
} = require('./methods');

(async () => {
    await connection;
    const axios = Axios.create({
        baseURL: API_URL,
    })
    const skins = [];

    try {
        const items = await getItems(axios)

        for (const item of items) {
            item.url = item.name.toLowerCase().trim().replaceAll(' ', '-');

            await models.skins.create(item)
                .catch(async err => {
                    if (err.code === 11000) {
                        return models.skins.updateOne({id: item.id}, item);
                    }

                    console.error(err.message, item.id);

                    return err;
                });
        }

        console.log('Skins parsed');
    }catch (err) {
        console.error(err?.request?.path, err.message, err?.response?.data)
    }
})();


