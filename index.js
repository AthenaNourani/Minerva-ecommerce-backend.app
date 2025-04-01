const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const passport = require('passport');
require('dotenv').config({ path: './.env' });
require('./src/config/passport')(passport);

const app = express();
const port = process.env.PORT || 5000;

// Überprüfen, ob `DB_URL` gesetzt ist
if (!process.env.DB_URL) {
    console.error('Error: DB_URL is not defined in .env file');
    process.exit(1);
}

// Middleware
app.use(express.json({ limit: "50mb" })); 
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(cookieParser());
app.use(cors({
    origin: ["http://localhost:5173", "https://minerva-frontend-final.vercel.app"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization", "Accept"]
}));

app.use(passport.initialize());

// Routen
const userRoutes = require('./src/routes/user.route.js');
const productRoutes = require('./src/routes/products.route.js');
const reviewRoutes = require('./src/routes/reviews.route.js');
const orderRoutes = require('./src/routes/orders.route.js');
const statsRoutes = require('./src/routes/stats.route.js');
const uploadImage = require('./src/utils/uploadImage'); // Richtige Import-Referenz

app.use('/api/auth', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/stats', statsRoutes);


// Verbindung zur Datenbank
async function connectDB() {
  try {
      await mongoose.connect(process.env.DB_URL);
      console.log('MongoDB is successfully connected.');
  } catch (err) {
      console.error('Error connecting to MongoDB:', err.message);
      process.exit(1);
  }
}
connectDB();

// Root-Route
app.get('/', (req, res) => {
    res.send('Minerva E-commerce Server is running...!');
});

// Upload-Route für Bilder
app.post('/uploadImage', async (req, res) => {
    try {
        if (!req.body.image) {
            return res.status(400).json({ error: "No image provided" });
        }

        console.log("Uploading image...");
        const url = await uploadImage(req.body.image);
        console.log("Image uploaded successfully:", url);
        res.status(200).json({ imageUrl: url });
    } catch (err) {
        console.error("Upload error:", err); 
        res.status(500).json({ error: err.message || "Unknown error" });
    }
});

// Starte den Server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
