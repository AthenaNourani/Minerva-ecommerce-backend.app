const nodemailer = require("nodemailer");
require('dotenv').config({ path: __dirname + '/../../.env' });

async function testEmail() {
  try {
    console.log("SMTP_USER:", process.env.SMTP_USER);
    console.log("SMTP_PASS:", process.env.SMTP_PASS);

    let transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    await transporter.verify();
    console.log("✅ Connection to SMTP successful!");

  } catch (error) {
    console.error("❌ SMTP connection failed:", error);
  }
}

testEmail();
