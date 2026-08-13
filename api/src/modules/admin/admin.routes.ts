import { Router } from 'express';
import * as adminService from './admin.service.js';
import * as documentsService from './documents.service.js';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { HttpError } from '../../middleware/errorHandler.js';

export const adminRouter = Router();


adminRouter.use(requireAuth, requireRole('ADMIN'));

adminRouter.get('/users', async (_req, res, next) => {
  try {
    res.json(await adminService.listUsers());
  } catch (err) {
    next(err);
  }
});

adminRouter.get('/listings', async (_req, res, next) => {
  try {
    res.json(await adminService.listAllListings());
  } catch (err) {
    next(err);
  }
});

adminRouter.patch('/listings/:type/:id/suspend', async (req, res, next) => {
  try {
    const { type, id } = req.params;
    if (type !== 'truck-availability' && type !== 'cargo-request') {
      throw new HttpError(400, 'type must be truck-availability or cargo-request');
    }
    res.json(await adminService.suspendListing(type, id));
  } catch (err) {
    next(err);
  }
});

adminRouter.get('/documents', async (_req, res, next) => {
  try {
    res.json(await documentsService.listPendingDocuments());
  } catch (err) {
    next(err);
  }
});

adminRouter.patch('/documents/:id', async (req, res, next) => {
  try {
    const outcome = req.body.outcome;
    if (outcome !== 'VERIFIED' && outcome !== 'REJECTED') {
      throw new HttpError(400, 'outcome must be VERIFIED or REJECTED');
    }
    res.json(await documentsService.decideDocument(req.params.id, req.auth!.userId, outcome));
  } catch (err) {
    next(err);
  }
});