const mongoose = require("mongoose");
const {connection, models} = require('../models');


const aggregate = async date => {
    const startDay = new Date(date);

    startDay.setHours(0, 0, 0, 0);
    startDay.setDate(startDay.getDate() - 2);

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

(async () => {
    await connection;

    const now = new Date('2026-02-09T00:00:26.097Z');
    await aggregate(now);

    process.exit()
})();


