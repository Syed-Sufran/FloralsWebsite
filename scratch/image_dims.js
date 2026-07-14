import fs from 'fs';
import path from 'path';

const files = [
  'bouquet_cutout.png',
  'butterfly_fixed.png',
  'BMW.png',
  'Giftbox.png',
  'chocolate.png'
];

const imagesDir = 'public/images';

files.forEach(file => {
  const filePath = path.join(imagesDir, file);
  try {
    const buffer = fs.readFileSync(filePath);
    // Verify PNG signature
    if (buffer.readUInt32BE(0) === 0x89504E47 && buffer.readUInt32BE(4) === 0x0D0A1A0A) {
      const width = buffer.readUInt32BE(16);
      const height = buffer.readUInt32BE(20);
      console.log(`${file}: ${width}x${height} (aspect ratio: ${(width/height).toFixed(4)})`);
    } else {
      console.log(`${file}: Not a valid PNG`);
    }
  } catch (err) {
    console.error(`Error reading ${file}:`, err.message);
  }
});
