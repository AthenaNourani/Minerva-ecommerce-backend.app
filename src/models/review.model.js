const mongoose = require('mongoose');
const { Schema, model } = mongoose;

// 🔹 Schema für Bewertungen (Reviews)
const ReviewSchema = new Schema({
    comment: { type: String, required: true }, // 🔹 Kommentar des Nutzers (Pflichtfeld)
    rating: { type: Number, required: true }, // 🔹 Bewertung (Pflichtfeld)
    userId: { type: mongoose.Types.ObjectId, ref: "User", required: true }, // 🔹 Nutzer, der die Bewertung abgegeben hat
    productId: { type: mongoose.Types.ObjectId, ref: "Product", required: true } // 🔹 Produkt, das bewertet wird
}, 
{ timestamps: true } // 🔹 Erstellt automatisch "createdAt" und "updatedAt"
); 

const Reviews = model('Review', ReviewSchema);

module.exports = Reviews;
