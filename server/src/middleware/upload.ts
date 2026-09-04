import type { NextFunction, Request, Response } from 'express';
import multer from 'multer';
import { ApiError } from '../utils/errors.js';

const ALLOWED_EXTENSIONS = ['.pdf', '.docx', '.txt', '.md'];

const multerUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const lower = file.originalname.toLowerCase();
    if (ALLOWED_EXTENSIONS.some((ext) => lower.endsWith(ext))) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file type — upload a PDF, DOCX, or plain text proposal.'));
    }
  },
}).single('file');

/** Wraps multer so upload errors (bad type, too large) become a normal 400 ApiError. */
export function uploadProposal(req: Request, res: Response, next: NextFunction) {
  multerUpload(req, res, (err: unknown) => {
    if (!err) return next();
    const message = err instanceof Error ? err.message : 'Upload failed';
    next(ApiError.badRequest(message));
  });
}
