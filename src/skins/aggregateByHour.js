const mongoose = require("mongoose");
const {connection, models} = require('../models');

(async () => {
    await connection;

    const now = new Date();
    const startHour = new Date(now);
    startHour.setMinutes(0, 0, 0);
    startHour.setHours(startHour.getHours() - 2);

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

            // 2. Группировка по market, name и часу
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
                    avgPricePerMarket: { $avg: "$price" },
                    avgStockPerMarket: { $avg: "$stock" }
                }
            },

            // 3. timestamp каждого часа
            {
                $project: {
                    market: "$_id.market",
                    name: "$_id.name",
                    hourTimestamp: {
                        $dateFromParts: {
                            year: "$_id.year",
                            month: "$_id.month",
                            day: "$_id.day",
                            hour: "$_id.hour"
                        }
                    },
                    avgPricePerMarket: 1,
                    avgStockPerMarket: 1
                }
            },

            // 4. Финальная агрегация по name + hourTimestamp
            {
                $group: {
                    _id: {
                        name: "$name",
                        hourTimestamp: "$hourTimestamp"
                    },
                    avgPriceAllMarkets: { $avg: "$avgPricePerMarket" },
                    sumHourlyStocksAcrossMarkets: { $sum: "$avgStockPerMarket" }
                }
            },

            // 5. Финальное форматирование и округление
            {
                $project: {
                    _id: 0,
                    name: "$_id.name",
                    timestamp: "$_id.hourTimestamp",
                    price: { $round: ["$avgPriceAllMarkets", 2] },
                    stock: "$sumHourlyStocksAcrossMarkets"
                }
            },

            // 6. Сохранение
            {
                $merge: {
                    into: "skinspricesbyhours",
                    on: ["name", "timestamp"],
                    whenMatched: "replace",
                    whenNotMatched: "insert"
                }
            }
        ]
    ).toArray()
    process.exit()
})();


