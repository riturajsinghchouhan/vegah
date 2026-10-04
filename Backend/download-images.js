import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';
import https from 'https';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Configure cloudinary with env variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadDir = path.join(process.cwd(), 'uploads');

// Create uploads directory if it doesn't exist
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

async function downloadImages() {
  try {
    console.log('Fetching image list from Cloudinary folder "vegah_uploads"...');
    let nextCursor = null;
    let count = 0;

    do {
      // Fetch resources from the folder
      const result = await cloudinary.search
        .expression('folder:vegah_uploads')
        .max_results(500)
        .next_cursor(nextCursor)
        .execute();

      const resources = result.resources;
      
      if (resources.length === 0 && count === 0) {
        console.log('No images found in Cloudinary "vegah_uploads" folder.');
        return;
      }

      for (const res of resources) {
        // Request the image in .webp format from Cloudinary
        const webpUrl = cloudinary.url(res.public_id, { secure: true, format: 'webp' });
        
        // Ensure no subfolders are created by taking only the last part of public_id
        const baseName = res.public_id.split('/').pop();
        const filename = `${baseName}.webp`;
        const filePath = path.join(uploadDir, filename);

        console.log(`Downloading ${filename}...`);
        
        // Download the file
        await new Promise((resolve, reject) => {
          https.get(webpUrl, (response) => {
            // Handle redirects if any
            if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
                https.get(response.headers.location, (redirectResponse) => {
                  if (redirectResponse.statusCode !== 200) {
                    reject(new Error(`Failed to download ${webpUrl}: ${redirectResponse.statusCode}`));
                    return;
                  }
                  const fileStream = fs.createWriteStream(filePath);
                  redirectResponse.pipe(fileStream);
                  fileStream.on('finish', () => {
                    fileStream.close();
                    resolve();
                  });
                }).on('error', reject);
                return;
            }

            if (response.statusCode !== 200) {
              reject(new Error(`Failed to download ${webpUrl}: ${response.statusCode}`));
              return;
            }
            const fileStream = fs.createWriteStream(filePath);
            response.pipe(fileStream);
            fileStream.on('finish', () => {
              fileStream.close();
              resolve();
            });
            fileStream.on('error', reject);
          }).on('error', reject);
        });
        
        count++;
      }
      
      nextCursor = result.next_cursor;
    } while (nextCursor);

    console.log(`\nSuccess! Downloaded ${count} images in WEBP format into the 'uploads' folder.`);
  } catch (error) {
    console.error('Error during download:', error);
  }
}

downloadImages();
