const verifyAdmin = (req, res, next) => {
    // 🔹 Überprüfen, ob der Benutzer eine Admin-Rolle hat
    if (req.role !== 'admin') { 
        return res.status(403).send({
            success: false,
            message: 'Du bist nicht autorisiert, diese Aktion auszuführen.' // 🔹 Nachricht verbessert
        });
    }

    next(); // 🔹 Weiter zur nächsten Middleware/Funktion
};

module.exports = verifyAdmin;
