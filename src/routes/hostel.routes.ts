import { Router } from 'express';
import { Role } from '@prisma/client';
import {
  listHostels,
  getHostel,
  createHostel,
  updateHostel,
  deactivateHostel,
  listRooms,
  getRoom,
  createRoom,
  updateRoom,
  deleteRoom,
} from '../controllers/hostel.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import {
  validate,
  createHostelSchema,
  updateHostelSchema,
  createRoomSchema,
  updateRoomSchema,
} from '../middleware/validation.middleware';

const router = Router();

router.get('/', listHostels);
router.get('/:id', getHostel);

router.post('/', authenticate, authorize(Role.ADMIN), validate(createHostelSchema), createHostel);
router.put('/:id', authenticate, authorize(Role.ADMIN), validate(updateHostelSchema), updateHostel);
router.delete('/:id', authenticate, authorize(Role.ADMIN), deactivateHostel);

router.get('/:hostelId/rooms', listRooms);
router.get('/:hostelId/rooms/:roomId', getRoom);

router.post('/:hostelId/rooms', authenticate, authorize(Role.ADMIN), validate(createRoomSchema), createRoom);
router.put('/:hostelId/rooms/:roomId', authenticate, authorize(Role.ADMIN), validate(updateRoomSchema), updateRoom);
router.delete('/:hostelId/rooms/:roomId', authenticate, authorize(Role.ADMIN), deleteRoom);

export default router;
