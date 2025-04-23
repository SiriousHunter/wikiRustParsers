const {mongoose} = require('mongoose');
const skins = require('./skins');
const sitemap = require('./sitemap');
const skinsHistory = require('./skinsPriceHistory');

const {
    MONGO_USER,
    MONGO_PASSWORD,
    MONGO_DB,
    MONGO_HOST,
    MONGO_PORT,
} = process.env;

const connectionUrl = `mongodb://${MONGO_USER}:${MONGO_PASSWORD}@${MONGO_HOST}:${MONGO_PORT}/${MONGO_DB}`;

const connection = mongoose.connect(connectionUrl);


module.exports = {
    connection,
    models: {
        skins,
        sitemap,
        skinsHistory,
    }
}
