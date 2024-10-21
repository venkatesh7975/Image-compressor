const express = require("express");
const cors = require("cors");
const multer = require("multer");
const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// File storage setup
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Function to compress image to approximate target size
const compressToTargetSize = async (buffer, targetSizeKB) => {
  let quality = 80;
  let compressedBuffer;
  let sizeKB = 0;

  do {
    compressedBuffer = await sharp(buffer)
      .resize({ width: 800 }) // Resize to width 800px
      .toFormat("jpeg", { quality }) // Convert to JPEG with quality
      .toBuffer();

    sizeKB = compressedBuffer.length / 1024; // size in KB
    quality -= 5; // Reduce quality incrementally
  } while (sizeKB > targetSizeKB && quality > 10); // Minimum quality to avoid degradation

  return compressedBuffer;
};

// Image upload and compression route
app.post("/upload", upload.single("image"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  try {
    const originalSize = req.file.size;
    const targetSizeKB = 25; // Target size in KB

    const compressedBuffer = await compressToTargetSize(
      req.file.buffer,
      targetSizeKB
    );
    const compressedSize = compressedBuffer.length;
    const reductionPercentage =
      ((originalSize - compressedSize) / originalSize) * 100;

    // Save compressed image to disk
    const compressedImagePath = path.join(
      uploadsDir,
      `compressed-${req.file.originalname}`
    );
    await sharp(compressedBuffer).toFile(compressedImagePath);

    res.json({
      originalSize,
      compressedSize,
      reductionPercentage: Math.round(reductionPercentage),
      filename: `compressed-${req.file.originalname}`,
      downloadLink: `/download/compressed-${req.file.originalname}`,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Image compression failed" });
  }
});

// Serve compressed images for download
app.get("/download/:filename", (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(uploadsDir, filename);

  res.download(filePath, (err) => {
    if (err) {
      console.error(err);
      res.status(404).send("File not found");
    }
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
