import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { uploadBuffer, isCloudinaryConfigured } from '../lib/cloudinary.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOAD_DIR = path.join(__dirname, '../../public/uploads');

if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

async function saveLocally(file, folder) {
  const dir = path.join(UPLOAD_DIR, folder);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
  fs.writeFileSync(path.join(dir, filename), file.buffer);
  return { secure_url: `/uploads/${folder}/${filename}`, public_id: `${folder}/${filename}` };
}

export const uploadMedia = asyncHandler(async (req, res) => {
  const folder = req.params.folder || 'misc';
  const allowedFolders = ['products', 'categories', 'sliders', 'avatars'];
  if (!allowedFolders.includes(folder)) {
    throw new AppError('Invalid upload folder', 400, 'INVALID_FOLDER');
  }
  if (!req.files || req.files.length === 0) {
    throw new AppError('No files uploaded', 422, 'NO_FILES');
  }

  const results = [];
  for (const file of req.files) {
    const result = isCloudinaryConfigured()
      ? await uploadBuffer(file.buffer, folder)
      : await saveLocally(file, folder);
    results.push({ url: result.secure_url, publicId: result.public_id });
  }

  res.status(201).json({ files: results, provider: isCloudinaryConfigured() ? 'cloudinary' : 'local' });
});
