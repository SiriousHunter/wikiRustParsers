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

const getItems = async (axios,  items = [], offset = 1) => {
    const count = 500;
    const {data, status} = await axios.get('/item', { params: {
            page: offset,
            detailed: true,
            pageSize: count,
    }});

    console.log(`PARSED SKINS: [page: ${offset}| count: ${data?.items?.length}`)

    if(!data?.items?.length) {
        return items;
    }

    if (status !== 200) {
        console.error(`Get items error. Status: ${status}`);
        return getItems(axios, items, offset)
    }

    if(data?.items?.length && offset < 10000) {

        return getItems(axios, items.concat(data.items), offset + 1)
    }else {
        items = items.concat(data.items)
    }

    return items;
}

module.exports = {
    getTypes,
    getCurrentStoreItems,
    getItems,
}
