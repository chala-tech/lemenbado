import { Router } from 'express';
import multer from 'multer';
import { supabase } from '../../lib/supabase.js';
import { env } from '../../lib/env.js';
import { requireAuth } from '../../middleware/auth.js';
import { HttpError } from '../../middleware/errorHandler.js';
import * as documentsService from '../admin/documents.service.js';

export const documentsRouter = Router();

// files stay in memory briefly, never touch disk — fine at this volume
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 }, // 8MB cap
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error('Only JPG, PNG, WEBP, or PDF files are allowed'));
    }
    cb(null, true);
  },
});

documentsRouter.use(requireAuth);

documentsRouter.post('/', upload.single('document'), async (req, res, next) => {
  try {
    if (!req.file) throw new HttpError(400, 'No file was uploaded');
    const type = req.body?.type;
    if (!type || typeof type !== 'string') throw new HttpError(400, 'Document type is required');

    const userId = req.auth!.userId;
    const ext = req.file.originalname.split('.').pop() || 'bin';
    const path = `${userId}/${Date.now()}-${type}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from(env.supabaseStorageBucket)
      .upload(path, req.file.buffer, { contentType: req.file.mimetype, upsert: false });

    if (uploadError) throw new HttpError(500, `Upload failed: ${uploadError.message}`);

    const document = await documentsService.submitDocument({ userId, type, fileUrl: path });
    res.status(201).json(document);
  } catch (err) {
    next(err);
  }
});

documentsRouter.get('/me', async (req, res, next) => {
  try {
    const documents = await documentsService.listMyDocuments(req.auth!.userId);
    res.json(documents);
  } catch (err) {
    next(err);
  }
});