const mongoose = require('mongoose');
const { Schema, model } = mongoose;

// 🔹 Schema für Produkte (Products)
const ProductSchema = new Schema({
    name: { type: String, required: true }, // 🔹 Name des Produkts (Pflichtfeld)
    category: { type: String }, // 🔹 Kategorie des Produkts
    description: { type: String }, // 🔹 Beschreibung des Produkts
    price: { type: Number, required: true }, // 🔹 Aktueller Preis (Pflichtfeld)
    oldPrice: { type: Number }, // 🔹 Alter Preis (optional)
    image: { type: String }, // 🔹 Bild-URL des Produkts
    color: { type: String }, // 🔹 Farbe des Produkts
    rating: { type: Number, default: 0 }, // 🔹 Bewertung (Standard: 0)
    author: { type: mongoose.Types.ObjectId, ref: "User", required: true } // 🔹 Verweis auf den Autor (Pflichtfeld)
});

const Products = model('Product', ProductSchema);

module.exports = Products;
