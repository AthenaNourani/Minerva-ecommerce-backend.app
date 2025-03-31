const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const model = mongoose.model;

// 🔹 Schema für Bestellungen (Orders)
const OrderSchema = new Schema({
    orderId: { type: String, required: true }, // 🔹 Eindeutige Bestellnummer
    products: [
        {
            productId: { type: String, required: true }, // 🔹 ID des Produkts
            quantity: { type: Number, required: true } // 🔹 Anzahl der bestellten Produkte
        }
    ],
    amount: Number, // 🔹 Gesamtbetrag der Bestellung
    email: { type: String, required: true }, // 🔹 E-Mail des Kunden
    status: {
        type: String,
        enum: ['pending', 'processing', 'shipped', 'completed'], // 🔹 Status der Bestellung
        default: 'pending' // 🔹 Standardstatus: "pending" (noch nicht bearbeitet)
    }
}, 
{ timestamps: true } // 🔹 Erstellt automatisch "createdAt" und "updatedAt"
);

const Order = model('Order', OrderSchema);
module.exports = Order;
