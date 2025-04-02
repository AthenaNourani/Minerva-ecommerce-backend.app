// 📦 Imports
const express = require("express");
const router = express.Router();
const User = require("../models/user.model");
const generateToken = require("../middleware/generateToken");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const bcrypt = require("bcrypt");

// ✅ Konfiguration für Nodemailer zum E-Mail-Versand
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// ✅ Alle Benutzer abrufen (z.B. für Admin-Dashboard)
router.get("/users", async (req, res) => {
  try {
    const users = await User.find().select("-password"); 
    res.status(200).json(users);
  } catch (error) {
    console.error("Fehler beim Abrufen der Benutzer:", error.message);
    res.status(500).json({ message: "Fehler beim Laden der Benutzerdaten." });
  }
});

// ✅ Registrierung mit E-Mail-Verifizierung
router.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // 🔐 Generiere und hashe Token für die E-Mail-Bestätigung
    const emailToken = crypto.randomBytes(32).toString("hex");
    const hashedEmailToken = crypto.createHash("sha256").update(emailToken).digest("hex");

    const user = new User({
      username,
      email,
      password,
      emailVerificationToken: hashedEmailToken,
      isEmailVerified: true,
    });
    await user.save();

    // 📧 Bestätigungslink erstellen
    const verificationLink = `http://localhost:5173/verify-email/${emailToken}`;
    const mailOptions = {
      from: `"Minerva E-Commerce" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "E-Mail Bestätigung",
      html: `<p>Klicken Sie auf den folgenden Link, um Ihre E-Mail-Adresse zu bestätigen:</p>
             <a href="${verificationLink}">${verificationLink}</a>
             <p>Dieser Link ist 15 Minuten gültig.</p>`
    };

    await transporter.sendMail(mailOptions);
    res.status(201).send({ message: "Benutzer registriert. Bestätigungs-E-Mail wurde gesendet." });

  } catch (error) {
    console.error("Fehler bei der Registrierung:", error.message);
    res.status(500).send({ message: "Fehler bei der Registrierung." });
  }
});

// ✅ E-Mail-Bestätigungsroute
router.get("/verify-email/:token", async (req, res) => {
  try {
    const hashedToken = crypto.createHash("sha256").update(req.params.token).digest("hex");

    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      isEmailVerified: true,
    });

    if (!user) {
      return res.status(400).json({ message: "Token ist ungültig oder Benutzer ist bereits verifiziert." });
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    await user.save();

    res.send("✅ Ihre E-Mail wurde erfolgreich bestätigt.");
  } catch (error) {
    console.error("Fehler bei der E-Mail-Bestätigung:", error);
    res.status(500).json({ message: "Interner Serverfehler." });
  }
});

// ✅ Login-Route mit E-Mail-Verifizierungsprüfung
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    // 🔍 Nutzer anhand der E-Mail finden
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).send({ message: "Benutzer nicht gefunden." });
    }

    // ✅ E-Mail muss vorher verifiziert sein
    if (!user.isEmailVerified) {
      return res.status(403).send({ message: "Bitte bestätigen Sie Ihre E-Mail zuerst." });
    }

    // 🔐 Passwort überprüfen
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).send({ message: "Passwort ist falsch." });
    }

    // 🔑 JWT-Token generieren
    const token = await generateToken(user._id);

    // 🍪 Token als Cookie senden
    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "None",
    });

    // ✅ Erfolgreiche Antwort mit Benutzerdaten
    res.status(200).send({
      message: "Login erfolgreich.",
      token,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        profileImage: user.profileImage,
        bio: user.bio,
        profession: user.profession,
      },
    });

  } catch (error) {
    console.error("Fehler beim Login:", error.message);
    res.status(500).send({ message: "Fehler beim Login." });
  }
});

// ✅ Logout-Route (löscht das Token-Cookie)
router.post("/logout", (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: true,
    sameSite: "None"
  });
  res.status(200).json({ message: "Logout erfolgreich" });
});

// ✅ Passwort-Zurücksetzen-Anfrage
router.post("/forgot-password", async (req, res) => {
  console.log("📩 Anfrage für Passwort-Reset erhalten");

  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "⚠️ E-Mail ist erforderlich" });
    }

    const cleanEmail = email.trim();
    console.log("📨 E-Mail empfangen:", cleanEmail);

    const user = await User.findOne({ email: new RegExp(`^${cleanEmail}$`, "i") });
    if (!user) {
      console.log("❌ Benutzer nicht gefunden:", cleanEmail);
      return res.status(404).json({ message: "Benutzer nicht gefunden" });
    }

    // 🛑 E-Mail muss vorher verifiziert sein
    if (!user.isEmailVerified) {
      return res.status(403).json({ message: "Bitte bestätigen Sie zuerst Ihre E-Mail-Adresse." });
    }
    
    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = Date.now() + 15 * 60 * 1000;
    await user.save();

    const resetLink = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    console.log("🔗 Reset-Link:", resetLink);

    const mailOptions = {
      from: `"Minerva E-Commerce" <${process.env.SMTP_USER}>`,
      to: cleanEmail,
      subject: "Passwort zurücksetzen",
      html: `<p>Klicken Sie auf den folgenden Link, um Ihr Passwort zurückzusetzen:</p>
             <a href="${resetLink}">${resetLink}</a>
             <p>Dieser Link ist nur 15 Minuten gültig.</p>`
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ E-Mail gesendet an ${cleanEmail}`);
    res.json({ message: "Reset-Link wurde gesendet" });

  } catch (error) {
    console.error("❌ Fehler beim Passwort-Reset:", error);
    res.status(500).json({ message: "❌ Fehler beim Senden der E-Mail", error: error.message });
  }
});

// ✅ Passwort-Zurücksetzen mit Token-Verifikation
router.post("/reset-password/:token", async (req, res) => {
  const { token } = req.params;
  const { newPassword } = req.body;

  try {
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({ 
      resetPasswordToken: hashedToken, 
      resetPasswordExpires: { $gt: Date.now() } 
    });

    if (!user) return res.status(400).json({ message: "Token ist ungültig oder abgelaufen" });

    user.password = await bcrypt.hash(newPassword, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ message: "Passwort erfolgreich geändert" });

  } catch (error) {
    console.error("Fehler beim Zurücksetzen des Passworts:", error);
    res.status(500).json({ message: "Fehler beim Zurücksetzen des Passworts" });
  }
});

module.exports = router;
