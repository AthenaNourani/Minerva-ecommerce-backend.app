const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

const JWT_SECRET = process.env.JWT_SECRET_KEY; // 🔹 Geheimschlüssel aus .env-Datei

// 🔹 Token für einen Benutzer generieren
const generateToken = async (userId) => {
   try {
        const user = await User.findById(userId);
        if (!user) {
            throw new Error("Benutzer nicht gefunden");
        }

        // 🔹 JWT erstellen mit Benutzer-ID und Rolle (1 Stunde gültig)
        return jwt.sign({ userId: user._id, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
        
   } catch (error) {
        console.error("Fehler beim Erstellen des Tokens:", error.message);
        return null; // Falls ein Fehler auftritt
   }
};

module.exports = generateToken;
