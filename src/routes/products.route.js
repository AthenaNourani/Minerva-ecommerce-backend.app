const express = require("express");
const router = express.Router();
const Products = require("../models/product.model");
const Reviews = require("../models/review.model");
const verifyToken = require("../middleware/verifyToken");
const verifyAdmin = require("../middleware/verifyAdmin");

// 🔹 Produkt erstellen
router.post("/create-product", async (req, res) => {
    try {
        const newProduct = new Products({ ...req.body });
        const savedProduct = await newProduct.save();
        res.status(201).send({ message: "Produkt erfolgreich erstellt", savedProduct });
    } catch (error) {
        console.error("Fehler beim Erstellen des Produkts:", error.message);
        res.status(500).send({ message: "Fehler beim Erstellen des Produkts" });
    }
});

// 🔹 Bewertungen berechnen und Produktbewertung aktualisieren
router.post("/update-product-rating/:id", async (req, res) => {
    try {
        const productId = req.params.id;
        const product = await Products.findById(productId);
        if (!product) {
            return res.status(404).send({ message: "Produkt nicht gefunden" });
        }

        const reviews = await Reviews.find({ productId });
        const totalReviews = reviews.length;

        if (totalReviews > 0) {
            const totalRating = reviews.reduce((acc, review) => acc + review.rating, 0);
            const averageRating = totalRating / totalReviews;

            product.rating = averageRating;
            await product.save();
        }

        res.status(200).send({ message: "Produktbewertung erfolgreich aktualisiert", product });
    } catch (error) {
        console.error("Fehler beim Aktualisieren der Produktbewertung:", error.message);
        res.status(500).send({ message: "Fehler beim Aktualisieren der Produktbewertung" });
    }
});

// 🔹 Alle Produkte abrufen mit Filtermöglichkeiten
router.get('/', async (req, res) => {
    try {
        const { category, color, minPrice, maxPrice, page = 1, limit = 10 } = req.query;
        let filter = {};

        if (category && category !== 'all') filter.category = category;
        if (color && color !== 'all') filter.color = color;
        if (minPrice && maxPrice) {
            const min = parseFloat(minPrice);
            const max = parseFloat(maxPrice);
            if (!isNaN(min) && !isNaN(max)) {
                filter.price = { $gte: min, $lte: max };
            }
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const totalProducts = await Products.countDocuments(filter);
        const totalPages = Math.ceil(totalProducts / parseInt(limit));
        const products = await Products.find(filter)
            .skip(skip)
            .limit(parseInt(limit))
            .populate("author", "email")
            .sort({ createdAt: -1 });

        res.status(200).send({ products, totalPages, totalProducts });
    } catch (error) {
        console.error("Fehler beim Abrufen der Produkte:", error);
        res.status(500).send({ message: "Fehler beim Abrufen der Produkte" });
    }
});

// 🔹 Ein einzelnes Produkt per ID abrufen
router.get('/:id', async (req, res) => {
    try {
        const productId = req.params.id;
        const product = await Products.findById(productId).populate("author", "email username");

        if (!product) {
            return res.status(404).send({ message: "Produkt nicht gefunden" });
        }

        const reviews = await Reviews.find({ productId }).populate("userId", "email username");
        res.status(200).send({ product, reviews });

    } catch (error) {
        console.error("Fehler beim Abrufen des Produkts:", error);
        res.status(500).send({ message: "Fehler beim Abrufen des Produkts" });
    }
});

// 🔹 Produkt aktualisieren (nur für Admins)
router.patch('/update-product/:id', verifyToken, verifyAdmin, async (req, res) => {
    try {
        const productId = req.params.id;
        const updatedProduct = await Products.findOneAndUpdate({ _id: productId }, { ...req.body }, { new: true });

        if (!updatedProduct) {
            return res.status(404).send({ message: "Produkt nicht gefunden" });
        }

        res.status(200).send({ message: "Produkt erfolgreich aktualisiert", product: updatedProduct });

    } catch (error) {
        console.error("Fehler beim Aktualisieren des Produkts:", error);
        res.status(500).send({ message: "Fehler beim Aktualisieren des Produkts" });
    }
});

// 🔹 Produkt löschen (nur für Admins)
router.delete('/:id', verifyToken, verifyAdmin, async (req, res) => {
    try {
        const productId = req.params.id;
        const deletedProduct = await Products.findByIdAndDelete(productId);

        if (!deletedProduct) {
            return res.status(404).send({ message: "Produkt nicht gefunden" });
        }

        await Reviews.deleteMany({ productId });
        res.status(200).send({ message: "Produkt erfolgreich gelöscht" });

    } catch (error) {
        console.error("Fehler beim Löschen des Produkts:", error);
        res.status(500).send({ message: "Fehler beim Löschen des Produkts" });
    }
});

// 🔹 Verwandte Produkte abrufen
router.get('/related/:id', async (req, res) => {
    try {
        const productId = req.params.id;
        const product = await Products.findById(productId);

        if (!product) {
            return res.status(404).send({ message: "Produkt nicht gefunden" });
        }

        const titleRegex = new RegExp(
            product.name.split(' ').filter((word) => word.length > 1).join('|'), 'i'
        );

        const relatedProducts = await Products.find({
            _id: { $ne: productId },
            $or: [
                { name: { $regex: titleRegex } },
                { category: product.category }
            ]
        });

        res.status(200).send({
            message: "Verwandte Produkte erfolgreich abgerufen",
            relatedProducts
        });
    } catch (error) {
        console.error("Fehler beim Abrufen verwandter Produkte:", error);
        res.status(500).send({ message: "Fehler beim Abrufen verwandter Produkte" });
    }
});

module.exports = router;
