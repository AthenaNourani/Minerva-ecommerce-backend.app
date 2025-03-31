const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

const JWT_SECRET = process.env.JWT_SECRET_KEY;

// 🔹 Middleware zur Token-Überprüfung
const verifyToken = (req, res, next) => {
    try {
        const token = req.cookies.token; // 🔹 Token aus Cookies holen
        // const token = req.headers.authorization?.split(" ")[1]; // 🔹 Alternative: Token aus Header holen
        
        if (!token) {
            return res.status(401).send({ message: 'Kein gültiger Token vorhanden' });
        }

        const decoded = jwt.verify(token, JWT_SECRET); // 🔹 Token entschlüsseln
        
        if (!decoded) {
            return res.status(401).send({ message: 'Token ungültig oder abgelaufen' });
        }

        req.userId = decoded.userId; // 🔹 Benutzer-ID zum Request hinzufügen
        req.role = decoded.role; // 🔹 Benutzerrolle zum Request hinzufügen
        next(); // 🔹 Weiter zur nächsten Middleware/Funktion

    } catch (error) {
        console.log('Fehler bei der Token-Überprüfung:', error);
        res.status(401).send({ message: 'Fehler bei der Token-Überprüfung' });
    }
};

module.exports = verifyToken;
