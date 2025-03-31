const crypto = require('crypto');
const fs = require('fs');
const { Strategy: JwtStrategy, ExtractJwt } = require('passport-jwt');
const User = require('../models/user.model');

// 🔹 Überprüfung des Secret Keys, falls nicht vorhanden → generieren & speichern
let secretKey = process.env.JWT_SECRET;

if (!secretKey) {
    try {
        secretKey = crypto.randomBytes(48).toString('hex');
        fs.appendFileSync('.env', `\nJWT_SECRET=${secretKey}`);
    } catch (err) {
        console.error("Fehler beim Generieren des Secret Keys:", err.message);
        process.exit(1);
    }
}

// 🔹 JWT-Strategie-Einstellungen
const options = {
    jwtFromRequest: req => req?.cookies['token'], // Token aus Cookies holen
    secretOrKey: secretKey,
};

// 🔹 Passport-Authentifizierung mit JWT
module.exports = passport => {
    passport.use(
        new JwtStrategy(options, async (jwt_payload, done) => {
            try {
                const user = await User.findById(jwt_payload.id);
                return user ? done(null, user) : done(null, false);
            } catch (err) {
                return done(err, false);
            }
        })
    );
};
