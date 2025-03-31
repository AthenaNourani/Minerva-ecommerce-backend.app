const express = require("express");
const Reviews = require("../models/review.model");
const Products = require("../models/product.model");
const router = express.Router();

// 🔹 Neue Bewertung erstellen oder aktualisieren
router.post("/post-review", async (req, res) => {
    try {
        const { comment, rating, userId, productId } = req.body;

        // 🔹 Überprüfen, ob alle erforderlichen Felder vorhanden sind
        if (!comment || !rating || !userId || !productId) {
            return res.status(400).send({ message: "Alle Felder sind erforderlich" });
        }

        // 🔹 Prüfen, ob bereits eine Bewertung des Benutzers für dieses Produkt existiert
        let review = await Reviews.findOne({ productId, userId });

        if (review) {
            // 🔹 Bestehende Bewertung aktualisieren
            review.comment = comment;
            review.rating = rating;
        } else {
            // 🔹 Neue Bewertung erstellen
            review = new Reviews({ comment, rating, userId, productId });
        }

        await review.save();

        // 🔹 Durchschnittliche Bewertung des Produkts neu berechnen
        const reviews = await Reviews.find({ productId });
        if (reviews.length > 0) {
            const totalRating = reviews.reduce((acc, review) => acc + review.rating, 0);
            const averageRating = totalRating / reviews.length;

            const product = await Products.findById(productId);
            if (!product) {
                return res.status(404).send({ message: "Produkt nicht gefunden" });
            }

            product.rating = averageRating;
            await product.save({ validateBeforeSave: false });
        }

        res.status(200).send({ message: "Bewertung erfolgreich verarbeitet", review });
    } catch (error) {
        console.error("Fehler beim Speichern der Bewertung:", error);
        res.status(500).send({ message: "Fehler beim Speichern der Bewertung" });
    }
});

// 🔹 Gesamtanzahl der Bewertungen abrufen
router.get("/total-review", async (req, res) => {
    try {
        const totalReviews = await Reviews.countDocuments();
        res.status(200).send({ totalReviews });
    } catch (error) {
        console.error("Fehler beim Abrufen der Gesamtanzahl der Bewertungen:", error);
        res.status(500).send({ message: "Fehler beim Abrufen der Gesamtanzahl der Bewertungen" });
    }
});

// 🔹 Bewertungen eines bestimmten Benutzers abrufen
router.get("/:userId", async (req, res) => {
    try {
        const { userId } = req.params;

        if (!userId) {
            return res.status(400).send({ message: "Benutzer-ID ist erforderlich" });
        }

        const reviews = await Reviews.find({ userId });

        if (reviews.length === 0) {
            return res.status(404).send({ message: "Keine Bewertungen für diesen Benutzer gefunden" });
        }

        res.status(200).send(reviews);
    } catch (error) {
        console.error("Fehler beim Abrufen der Bewertungen des Benutzers:", error);
        res.status(500).send({ message: "Fehler beim Abrufen der Bewertungen" });
    }
});

module.exports = router;
