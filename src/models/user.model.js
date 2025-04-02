// ✅ Benutzer-Modell mit Email-Verifikationsfeld
const mongoose = require('mongoose');
const { Schema, model } = mongoose;
const bcrypt = require('bcrypt');

// 🔹 Benutzer-Schema 
const userSchema = new Schema({
  username: { type: String, required: true, unique: true },         // 🔹 Eindeutiger Benutzername
  email: { type: String, required: true, unique: true },            // 🔹 E-Mail-Adresse (muss eindeutig sein)
  password: { type: String, required: true },                       // 🔐 Passwort (wird gehashed gespeichert)
  role: { type: String, default: 'admin' },                         // 🔸 Benutzerrolle (Standard: admin)
  profileImage: String,                                             // 🖼️ Profilbild (optional)
  bio: { type: String, maxlength: 200 },                            // 📝 Kurzbiografie (max. 200 Zeichen)
  profession: String,                                               // 💼 Beruf (optional)

  // 🔐 Token & Ablaufzeit für Passwort-Zurücksetzung
  resetPasswordToken: String,
  resetPasswordExpires: Date,

  createdAt: { type: Date, default: Date.now },                     // 📅 Erstellungsdatum

  // 🔐 Email-Bestätigung
  isEmailVerified: {
    type: Boolean,

    // 💡 Hinweis: Da keine echte E-Mail-Verifizierung in dieser Entwicklungsumgebung erfolgt,
    // setzen wir diesen Wert immer auf "true", damit Benutzer sich einloggen können,
    // ohne eine Bestätigungsmail erhalten zu haben.
  },
});

// 🔐 Middleware: Passwort automatisch hashen vor dem Speichern
userSchema.pre('save', async function (next) {
  const user = this;
  if (!user.isModified('password')) return next();                 // Wenn Passwort nicht geändert wurde → weiter
  user.password = await bcrypt.hash(user.password, 10);            // Passwort mit bcrypt hashen
  next();
});

// 🔑 Methode zum Passwort-Vergleich beim Login
userSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);         // Vergleich des eingegebenen Passworts mit dem gespeicherten Hash
};

const User = model('User', userSchema);

module.exports = User;
