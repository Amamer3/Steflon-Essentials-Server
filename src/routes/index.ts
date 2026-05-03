import { Router } from 'express';
import v1Routes from './v1';
import docsRoutes from './docs';

const router = Router();

// API V1 Routes
router.use('/v1', v1Routes);

// Documentation routes
router.use('/docs', docsRoutes);

export default router;

