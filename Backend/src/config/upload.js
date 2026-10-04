import multer from 'multer';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';
import env from './env.js';

// The directory where you want to save the uploaded WebP images
// If UPLOAD_DIR is set in env, it uses that (e.g. '/var/www/uploads'), else falls back to local 'uploads'
const uploadDir = env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// We use memoryStorage so we can process the image with Sharp before saving it
const storage = multer.memoryStorage();

export const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Optional: Only allow image files if needed
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Middleware to process image and convert to WebP using Sharp
export const processImageToWebp = async (req, res, next) => {
  if (!req.file && (!req.files || req.files.length === 0)) {
    return next(); // No file uploaded, proceed to next middleware
  }

  try {
    const processFile = async (file) => {
      const filename = `${file.fieldname}-${Date.now()}-${Math.round(Math.random() * 1E9)}.webp`;
      const filepath = path.join(uploadDir, filename);

      await sharp(file.buffer)
        .webp({ quality: 80 }) // Convert to webp with 80% quality
        .toFile(filepath);

      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const fullUrl = `${baseUrl}/uploads/${filename}`;

      // Mutate the req.file object to reflect the new saved file
      file.path = fullUrl; // mimic Cloudinary behavior where path is the URL
      file.filename = filename;
      file.url = fullUrl;
    };

    if (req.file) {
      await processFile(req.file);
    } else if (req.files) {
      if (Array.isArray(req.files)) {
        await Promise.all(req.files.map(processFile));
      } else {
        // If it's an object (e.g., from fields())
        for (const fieldName in req.files) {
          await Promise.all(req.files[fieldName].map(processFile));
        }
      }
    }

    next();
  } catch (error) {
    console.error('Error processing image to WebP:', error);
    next(error);
  }
};

