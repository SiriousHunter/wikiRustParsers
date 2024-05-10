const mongoose = require('mongoose');

const skinsSchema = mongoose.Schema({
    id: {type: Number},
    name: {type: String},
    itemShortName: {type: String},
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
    breaksIntoComponents: [{type: Object}],
    buyPrices: {
        marketType: {type: String},
        acceptedPayments: {type: String},
        housePrice: {type: Number},
        housePriceName: {type: String},
        price: {type: Number},
        fee: {type: Number},
        supply: {type: Number},
        isAvailable: {type: Boolean},
        url: {type: String}
    },
    isAccepted: {type: Boolean},
    timeAccepted: {type: String},
    timeUpdated: {type: String},
    timeCreated: {type: String},
    timeRefreshed: {type: String},
});

module.exports = mongoose.model('Skins', skinsSchema);
