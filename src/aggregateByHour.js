const mongoose = require("mongoose");
const {connection, models} = require('./models');

const aggregateSkinsByHour = async startHour => {
    await mongoose.connection.db.collection('skinsprices').aggregate(
        [
            // 1. Фильтр по полным часам: >= startHour && < endHour
            {
                $match: {
                    timestamp: {
                        $gte: startHour,
                    }
                }
            },

            // 2. Сортировка по времени для корректного $last
            { $sort: { timestamp: 1 } },

            // 3. Группировка по market, name и часу
            {
                $group: {
                    _id: {
                        market: "$market",
                        name: "$name",
                        year: { $year: "$timestamp" },
                        month: { $month: "$timestamp" },
                        day: { $dayOfMonth: "$timestamp" },
                        hour: { $hour: "$timestamp" }
                    },
                    lastPrice: { $last: "$price" },
                    lastStock: { $last: "$stock" },
                    stocks: { $push: "$stock" }
                }
            },

            // 4. Форматирование, округление и подсчёт продаж
            {
                $project: {
                    _id: 0,
                    market: "$_id.market",
                    name: "$_id.name",
                    timestamp: {
                        $dateFromParts: {
                            year: "$_id.year",
                            month: "$_id.month",
                            day: "$_id.day",
                            hour: "$_id.hour"
                        }
                    },
                    price: { $round: ["$lastPrice", 2] },
                    stock: { $round: ["$lastStock"] },
                    sales: {
                        $reduce: {
                            input: { $range: [1, { $size: "$stocks" }] },
                            initialValue: 0,
                            in: {
                                $add: [
                                    "$$value",
                                    { $max: [
                                            0,
                                            { $subtract: [
                                                    { $arrayElemAt: ["$stocks", { $subtract: ["$$this", 1] }] },
                                                    { $arrayElemAt: ["$stocks", "$$this"] }
                                                ]}
                                        ]}
                                ]
                            }
                        }
                    }
                }
            },

            // 4. Сохранение
            {
                $merge: {
                    into: "skinspricesbyhours",
                    on: ["market", "name", "timestamp"],
                    whenMatched: "replace",
                    whenNotMatched: "insert"
                }
            }
        ]
    ).toArray()
}

const aggregateServersPlayersByHour = async startHour => {
    await mongoose.connection.db.collection('servers_players').aggregate(
        [
            // 1. Фильтр по полным часам: >= startHour
            {
                $match: {
                    timestamp: {
                        $gte: startHour,
                    }
                }
            },

            // 2. Группировка по address и часу
            {
                $group: {
                    _id: {
                        address: "$address",
                        year: { $year: "$timestamp" },
                        month: { $month: "$timestamp" },
                        day: { $dayOfMonth: "$timestamp" },
                        hour: { $hour: "$timestamp" }
                    },
                    maxPlayers: { $max: "$playersCount" },
                    minPlayers: { $min: "$playersCount" },
                    avgPlayers: { $avg: "$playersCount" },
                    avgQueue: { $avg: "$playersQueue" }
                }
            },

            // 3. Форматирование и округление
            {
                $project: {
                    _id: 0,
                    address: "$_id.address",
                    timestamp: {
                        $dateFromParts: {
                            year: "$_id.year",
                            month: "$_id.month",
                            day: "$_id.day",
                            hour: "$_id.hour"
                        }
                    },
                    maxPlayers: { $round: ["$maxPlayers"] },
                    minPlayers: { $round: ["$minPlayers"] },
                    avgPlayers: { $round: ["$avgPlayers", 2] },
                    avgQueue: { $round: [{ $ifNull: ["$avgQueue", 0] }, 2] }
                }
            },

            // 4. Сохранение
            {
                $merge: {
                    into: "servers_players_by_hours",
                    on: ["address", "timestamp"],
                    whenMatched: "replace",
                    whenNotMatched: "insert"
                }
            }
        ]
    ).toArray()
}

const aggregate = async date => {
    const startHour = new Date(date);
    startHour.setMinutes(0, 0, 0);
    startHour.setHours(startHour.getHours() - 2);

    // await aggregateSkinsByHour(startHour);
    await aggregateServersPlayersByHour(startHour);
}


(async () => {
    await connection;

    const now = new Date();
    await aggregate(now);

    process.exit()
})();
