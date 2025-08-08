const mongoose = require("mongoose");
const {connection, models} = require('../models');

(async () => {
    await connection;

    const now = new Date();
    const startDay = new Date(now);

    startDay.setHours(0, 0, 0, 0);
    startDay.setDate(startDay.getDate() - 2);

    await mongoose.connection.db.collection('skinsprices').aggregate([
        // 1. Фильтр по дате: два полных дня, исключая сегодня
        {
            $match: {
                timestamp: {
                    $gte: startDay,
                }
            }
        },

        // 2. Группировка по market, name и дню
        {
            $group: {
                _id: {
                    market: "$market",
                    name: "$name",
                    year: { $year: "$timestamp" },
                    month: { $month: "$timestamp" },
                    day: { $dayOfMonth: "$timestamp" }
                },
                avgPricePerMarket: { $avg: "$price" },
                avgStockPerMarket: { $avg: "$stock" }
            }
        },

        // 3. Создание даты (без времени)
        {
            $project: {
                market: "$_id.market",
                name: "$_id.name",
                date: {
                    $dateFromParts: {
                        year: "$_id.year",
                        month: "$_id.month",
                        day: "$_id.day"
                    }
                },
                avgPricePerMarket: 1,
                avgStockPerMarket: 1
            }
        },

        // 4. Группировка по name и дню — объединяем рынки
        {
            $group: {
                _id: {
                    name: "$name",
                    date: "$date"
                },
                avgPriceAllMarkets: { $avg: "$avgPricePerMarket" },
                sumDailyStocksAcrossMarkets: { $sum: "$avgStockPerMarket" }
            }
        },

        // 5. Форматирование финального вывода
        {
            $project: {
                _id: 0,
                name: "$_id.name",
                timestamp: "$_id.date",
                price: { $round: ["$avgPriceAllMarkets", 2] },
                stock: { $round: ["$sumDailyStocksAcrossMarkets"] }
            }
        },

        // 6. Сохраняем в обычную коллекцию
        {
            $merge: {
                into: "skinspricesbydays",
                on: ["name", "timestamp"],
                whenMatched: "replace",
                whenNotMatched: "insert"
            }
        }
    ]).toArray()



    process.exit()
})();


