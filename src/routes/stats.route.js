const express = require('express');
const router = express.Router();
const User = require('../models/user.model');
const Order = require('../models/order.model');
const Review = require('../models/review.model');
const Products = require('../models/product.model');

// 🔹 Benutzerstatistiken abrufen (basierend auf der E-Mail)
router.get('/user-stats/:email', async (req, res) => {
    const { email } = req.params;
    if (!email) {
        return res.status(400).send({ message: 'Email is required' });
    }

    try {
        const user = await User.findOne({ email: email });
        if (!user) return res.status(404).send({ message: 'User not found' });

        // 🔹 Gesamtausgaben des Benutzers berechnen
        const totalPaymentResult = await Order.aggregate([
            { $match: { email: email } },
            { 
                $group: {
                    _id: null,
                    totalAmount: { $sum: "$amount" }
                }
            }
        ]);

        const totalPaymentAmount = totalPaymentResult.length > 0 
            ? totalPaymentResult[0].totalAmount 
            : 0;

        // 🔹 Anzahl der abgegebenen Bewertungen ermitteln
        const totalReviews = await Review.countDocuments({ userId: user._id });

        // 🔹 Anzahl der gekauften Produkte berechnen
        const purchasedProducts = await Order.distinct("products.productId", { email: email });
        const totalPurchasedProducts = purchasedProducts.length;

        res.status(200).send({
            totalPayments: totalPaymentAmount.toFixed(2),
            totalReviews,
            totalPurchasedProducts
        });

    } catch (error) {
        console.error("Error fetching user stats", error);
        res.status(500).send({ message: 'Failed to fetch user stats' });
    }
});

// ✅ Admin-Statistiken abrufen (Pfad: `/admin-stats`)
router.get('/admin-stats', async (req, res) => {
    try {
        const totalOrders = await Order.countDocuments();
        const totalProducts = await Products.countDocuments();
        const totalReviews = await Review.countDocuments();
        const totalUsers = await User.countDocuments();

        // 🔹 Gesamteinnahmen berechnen
        const totalEarningsResult = await Order.aggregate([ 
            {
                $group: {
                    _id: null,
                    totalEarnings: { $sum: "$amount" }
                }
            }
        ]);
        const totalEarnings = totalEarningsResult.length > 0 
            ? totalEarningsResult[0].totalEarnings.toFixed(2) 
            : "0.00";

        // 🔹 Monatliche Einnahmen berechnen
        const monthlyEarningsResult = await Order.aggregate([
            {
                $addFields: { createdAtDate: { $toDate: "$createdAt" } }
            },
            {
                $group: {
                    _id: { month: { $month: "$createdAtDate" }, year: { $year: "$createdAtDate" } },
                    monthlyEarnings: { $sum: "$amount" }
                }
            },
            {
                $sort: { "_id.year": 1, "_id.month": 1 }
            }
        ]);
        
        // 🛠 Falls keine Daten vorhanden sind, leere Liste zurückgeben
        const monthlyEarnings = monthlyEarningsResult.length > 0
            ? monthlyEarningsResult.map((entry) => ({
                month: entry._id.month,
                year: entry._id.year,
                earnings: entry.monthlyEarnings.toFixed(2),
              }))
            : []; // 🔹 Falls keine Daten vorhanden sind, leere Liste zurückgeben

        res.status(200).json({
            totalOrders,
            totalProducts,
            totalReviews,
            totalEarnings,
            monthlyEarnings,  // ✅ Stelle sicher, dass es zurückgegeben wird
            totalUsers
        });

    } catch (error) {
        console.error("Error fetching admin stats", error);
        res.status(500).send({ message: 'Failed to fetch admin stats' });
    }
});


module.exports = router;
