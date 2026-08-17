
import express from 'express';
import cors from 'cors';
import { env } from './lib/env.js';
import { authRouter } from './modules/auth/auth.routes.js';
import { citiesRouter } from './modules/cities/cities.routes.js';
import { trucksRouter } from './modules/trucks/trucks.routes.js';
import { truckTypesRouter } from './modules/trucks/truck-types.routes.js';
import { availabilityRouter } from './modules/availability/availability.routes.js';
import { errorHandler } from './middleware/errorHandler.js';
import { cargoRouter } from './modules/cargo/cargo.routes.js';
import { matchingRouter } from './modules/matching/matching.routes.js';
import { bookingsRouter } from './modules/bookings/bookings.routes.js';
import { adminRouter } from './modules/admin/admin.routes.js';
import { reviewsRouter } from './modules/reviews/reviews.routes.js';
import { cargoTypesRouter } from './modules/cargo/cargo-types.routes.js';
import { documentsRouter } from './modules/documents/documents.routes.js';

const app = express();

// Part 11 — CORS locked to one known origin, not '*'
app.use(cors({ origin: env.frontendOrigin }));
app.use(express.json());

app.get('/health', (_req, res) => res.json({ ok: true }));

app.use('/api/auth', authRouter);
app.use('/api/cities', citiesRouter);
app.use('/api/trucks', trucksRouter);
app.use('/api/truck-types', truckTypesRouter);
app.use('/api/truck-availability', availabilityRouter);
app.use('/api/cargo', cargoRouter);
app.use('/api/matches', matchingRouter);
app.use('/api/bookings', bookingsRouter);
app.use('/api/admin', adminRouter);
app.use('/api/documents', documentsRouter);
app.use('/api/reviews', reviewsRouter);
app.use(errorHandler);
app.listen(env.port, () => {
  console.log(`Lemenbado API listening on http://localhost:${env.port}`);
});