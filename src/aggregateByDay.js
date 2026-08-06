const mongoose = require("mongoose");
const {connection, models} = require('./models');


const aggregateSkinsByDay = async startDay => {
    await mongoose.connection.db.collection('skinspricesbyhours').aggregate([
        // 1. Фильтр по дате
        {
            $match: {
                timestamp: {
                    $gte: startDay,
                }
            }
        },

        // 2. Сортировка по времени для корректного $last
        { $sort: { timestamp: 1 } },

        // 3. Группировка по market, name и дню
        {
            $group: {
                _id: {
                    market: "$market",
                    name: "$name",
                    year: { $year: "$timestamp" },
                    month: { $month: "$timestamp" },
                    day: { $dayOfMonth: "$timestamp" }
                },
                lastPrice: { $last: "$price" },
                lastStock: { $last: "$stock" },
                sales: { $sum: "$sales" }
            }
        },

        // 4. Форматирование и округление
        {
            $project: {
                _id: 0,
                market: "$_id.market",
                name: "$_id.name",
                timestamp: {
                    $dateFromParts: {
                        year: "$_id.year",
                        month: "$_id.month",
                        day: "$_id.day"
                    }
                },
                price: { $round: ["$lastPrice", 2] },
                stock: { $round: ["$lastStock"] },
                sales: 1
            }
        },

        // 5. Сохранение
        {
            $merge: {
                into: "skinspricesbydays",
                on: ["market", "name", "timestamp"],
                whenMatched: "replace",
                whenNotMatched: "insert"
            }
        }
    ]).toArray()
}

const aggregateServersPlayersByDay = async startDay => {
    await mongoose.connection.db.collection('servers_players_by_hours').aggregate([
        // 1. Фильтр по дате
        {
            $match: {
                timestamp: {
                    $gte: startDay,
                }
            }
        },

        // 2. Группировка по address и дню
        {
            $group: {
                _id: {
                    address: "$address",
                    year: { $year: "$timestamp" },
                    month: { $month: "$timestamp" },
                    day: { $dayOfMonth: "$timestamp" }
                },
                maxPlayers: { $max: "$maxPlayers" },
                minPlayers: { $min: "$minPlayers" },
                avgPlayers: { $avg: "$avgPlayers" },
                avgQueue: { $avg: "$avgQueue" }
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
                        day: "$_id.day"
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
                into: "servers_players_by_days",
                on: ["address", "timestamp"],
                whenMatched: "replace",
                whenNotMatched: "insert"
            }
        }
    ]).toArray()
}

const updateServersAvgPlayers = async date => {
    const endDay = new Date(date);
    endDay.setHours(0, 0, 0, 0);

    const start1d = new Date(endDay);
    start1d.setDate(start1d.getDate() - 1);

    const start7d = new Date(endDay);
    start7d.setDate(start7d.getDate() - 7);

    const start30d = new Date(endDay);
    start30d.setDate(start30d.getDate() - 30);

    await mongoose.connection.db.collection('servers_players_by_days').aggregate([
        {
            $match: {
                timestamp: {
                    $gte: start30d,
                    $lt: endDay,
                }
            }
        },
        {
            $group: {
                _id: "$address",
                avgPlayers1d: {
                    $avg: {
                        $cond: [{ $gte: ["$timestamp", start1d] }, "$avgPlayers", null]
                    }
                },
                avgPlayers7d: {
                    $avg: {
                        $cond: [{ $gte: ["$timestamp", start7d] }, "$avgPlayers", null]
                    }
                },
                avgPlayers30d: { $avg: "$avgPlayers" }
            }
        },
        {
            $project: {
                _id: 0,
                connect: "$_id",
                avgPlayers1d: { $round: ["$avgPlayers1d", 2] },
                avgPlayers7d: { $round: ["$avgPlayers7d", 2] },
                avgPlayers30d: { $round: ["$avgPlayers30d", 2] }
            }
        },
        {
            $merge: {
                into: "servers",
                on: "connect",
                whenMatched: "merge",
                whenNotMatched: "discard"
            }
        }
    ]).toArray()
}

const aggregate = async date => {
    const startDay = new Date(date);

    startDay.setHours(0, 0, 0, 0);
    startDay.setDate(startDay.getDate() - 2);

    // await aggregateSkinsByDay(startDay).catch(console.error);
    await aggregateServersPlayersByDay(startDay).catch(console.error);
    // await updateServersAvgPlayers(date).catch(console.error);
}

(async () => {
    await connection;

    const now = new Date('2026-07-06T06:23:57.791Z');
    await aggregate(now);

    process.exit()
})();
