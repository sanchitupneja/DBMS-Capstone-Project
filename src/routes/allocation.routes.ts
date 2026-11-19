import { Router } from 'express';
import { Role } from '@prisma/client';
import {
  createRequest,
  listRequests,
  getRequest,
  cancelRequest,
  processRequest,
  triggerAutoAllocation,
  listAllocations,
  vacateAllocation,
  getDashboardMetrics,
} from '../controllers/allocation.controller';
import { listStudents } from '../controllers/auth.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import {
  validate,
  createRequestSchema,
  processRequestSchema,
} from '../middleware/validation.middleware';

const router = Router();

router.post(
  '/requests/auto-allocate',
  authenticate,
  authorize(Role.ADMIN),
  triggerAutoAllocation
);

router.post(
  '/requests',
  authenticate,
  authorize(Role.STUDENT),
  validate(createRequestSchema),
  createRequest
);

router.get('/requests', authenticate, listRequests);

router.get('/requests/:id', authenticate, getRequest);

router.patch(
  '/requests/:id/cancel',
  authenticate,
  authorize(Role.STUDENT),
  cancelRequest
);

router.patch(
  '/requests/:id/process',
  authenticate,
  authorize(Role.ADMIN),
  validate(processRequestSchema),
  processRequest
);

router.get('/allocations', authenticate, listAllocations);

router.patch(
  '/allocations/:id/vacate',
  authenticate,
  authorize(Role.ADMIN),
  vacateAllocation
);

router.get(
  '/admin/dashboard',
  authenticate,
  authorize(Role.ADMIN),
  getDashboardMetrics
);

router.get(
  '/admin/students',
  authenticate,
  authorize(Role.ADMIN),
  listStudents
);

export default router;
