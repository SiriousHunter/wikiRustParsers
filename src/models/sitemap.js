const mongoose = require('mongoose');

const sitemapSchema = mongoose.Schema({
    path: { type: String, required: true, index: true},
    image: { type: String },
    title: { type: String, required: true },
    description: { type: String, required: true },
    lang: { type: String, required: true, enum: ['ru', 'en'] },
    keywords: { type: String },
    enabled: { type: Boolean, default: true},
    search: { type: Boolean, default: true},
    meta: [{
        property: { type: String },
        content: { type: String },
    }],
    alternate: [{
        hreflang: { type: String},
        href: { type: String},
    }],
});

module.exports = mongoose.model('Sitemap', sitemapSchema);
