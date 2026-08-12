
import express from 'express';
import cors from 'cors';
import { env } from './lib/env';
import { authRouter } from './modules/auth/auth.routes';
import { citiesRouter } from './modules/cities/cities.routes';
import { trucksRouter } from './modules/trucks/trucks.routes';
import { truckTypesRouter } from './modules/trucks/truck-types.routes';
import { availabilityRouter } from './modules/availability/availability.routes';
import { errorHandler } from './middleware/errorHandler';
import { cargoRouter } from './modules/cargo/cargo.routes';
import { matchingRouter } from './modules/matching/matching.routes';
import { bookingsRouter } from './modules/bookings/bookings.routes';
import { adminRouter } from './modules/admin/admin.routes';
import { reviewsRouter } from './modules/reviews/reviews.routes';
import { documentsRouter } from './modules/documents/documents.routes';

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