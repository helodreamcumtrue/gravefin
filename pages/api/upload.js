import fs from 'fs';
import path from 'path';
import { parseSession } from '../../lib/auth';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '50mb'
    }
  }
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const userId = parseSession(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { fileName, fileBase64 } = req.body;
    if (!fileName || !fileBase64) {
      return res.status(400).json({ error: 'File name and base64 content required' });
    }

    // Edge Case §8 & Assumption §10: 50MB limit check
    const buffer = Buffer.from(fileBase64, 'base64');
    if (buffer.length > 50 * 1024 * 1024) {
      return res.status(400).json({ error: 'File size exceeds maximum allowed limit of 50MB' });
    }

    // Verify zip extension
    if (!fileName.toLowerCase().endsWith('.zip') && !fileName.toLowerCase().endsWith('.tar.gz')) {
      return res.status(400).json({ error: 'Only .zip or .tar.gz archives are allowed' });
    }

    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const safeName = `${Date.now()}_${fileName.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const filePath = path.join(uploadsDir, safeName);
    fs.writeFileSync(filePath, buffer);

    const fileUrl = `/uploads/${safeName}`;

    return res.status(200).json({
      fileUrl,
      fileName: safeName,
      sizeBytes: buffer.length
    });
  } catch (err) {
    console.error('Upload error:', err);
    return res.status(500).json({ error: 'Failed to process upload' });
  }
}
