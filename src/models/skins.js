const mongoose = require('mongoose');

const skinsSchema = mongoose.Schema({
    id: {type: Number, unique: true},
    name: {type: String},
    url: {type: String},
    itemCollection: {type: String},
    itemShortName: {type: String},
    itemDefinitionType: {type: String},
    itemType: {type: String},
    description: {type: String},
    iconLargeUrl: {type: String},
    previewUrl: {type: String},
    isMarketable: {type: Boolean},
    isTradable: {type: Boolean},
    isTwitchDrop: {type: Boolean},
    isCommodity: {type: Boolean},
    isLootCrateDrop: {type: Boolean},
    isCraftingComponent: {type: Boolean},
    isCraftable: {type: Boolean},
    isBreakable: {type: Boolean},
    isAvailableOnStore: {type: Boolean},
    breaksIntoComponents: [{type: Object}],
    buyNowPrice: {type: Number},
    buyPrices: [{
        marketType: {type: String},
        acceptedPayments: {type: String},
        housePrice: {type: Number},
        housePriceName: {type: String},
        price: {type: Number},
        fee: {type: Number},
        supply: {type: Number},
        isAvailable: {type: Boolean},
        url: {type: String},
        updatedTime: {type: Date}
    }],
    isAccepted: {type: Boolean},
    timeAccepted: {type: String},
    timeUpdated: {type: String},
    timeCreated: {type: String},
    timeRefreshed: {type: String},
});

module.exports = mongoose.model('Skins', skinsSchema);
