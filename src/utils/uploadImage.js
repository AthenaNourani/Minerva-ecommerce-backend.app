const cloudinary = require('cloudinary').v2;

// Lade Cloudinary-Keys sicher aus der .env-Datei
cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const options = {
    overwrite: true,
    invalidate: true,
    resource_type: "image",
    folder: "uploads",
    transformation: [{ width: 800, crop: "limit" }]
};

module.exports = (image) => {
    return new Promise((resolve, reject) => {
        if (!image.startsWith("data:image")) {
            console.error("Invalid image format detected");
            return reject({ message: "Invalid image format." });
        }

        cloudinary.uploader.upload(image, options, (error, result) => {
            if (error) {
                console.error("Cloudinary error:", error);
                return reject({ message: error.message || "Upload failed." });
            }
            console.log("Cloudinary upload successful:", result.secure_url);
            return resolve(result.secure_url);
        });
    });
};
