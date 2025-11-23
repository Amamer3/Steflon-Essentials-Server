import { Router } from 'express';
import { apiReference } from '@scalar/express-api-reference';
import { openApiSpec } from '../config/openapi';

const router = Router();

// Serve Scalar API documentation
router.use(
  '/',
  apiReference({
    theme: 'purple',
    layout: 'modern',
    spec: {
      content: openApiSpec,
    },
  })
);

export default router;

