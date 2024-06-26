const getTypes = async axios => {
    const {data: typesList} = await axios.get(`/item/types`)

    const types =  typesList.map(({itemTypes}) =>
        itemTypes.map(({id, name}) => ({[name]: id}))
    ).flat();

    return types.reduce((acc, type) => ({...acc, ...type}))
}

const getCurrentStoreItems = async axios => {
    const {data: currentStore} = await axios.get('/store/current');

    return currentStore.items.map(item => item.name);
}

const getItems = async (axios,  items = [], offset = 0) => {
    const count = 500;
    const {data, status} = await axios.get('/item', { params: {
            start: offset,
            detailed: true,
            count,
    }});

    if (status !== 200) {
        console.error(`Get items error. Status: ${status}`);
        return getItems(axios, items, offset)
    }

    if(items.length < data.total && offset < data.total && offset < 10000) {
        console.log(`PARSED SKINS: ${offset + count}`)
        return getItems(axios, items.concat(data.items), offset + count)
    }

    return items;
}

module.exports = {
    getTypes,
    getCurrentStoreItems,
    getItems,
}
