import { Router } from 'express';
import {
  registerStudent,
  login,
  logout,
  refreshToken,
  getMe,
} from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';
import {
  validate,
  registerStudentSchema,
  loginSchema,
  refreshTokenSchema,
} from '../middleware/validation.middleware';

const router = Router();

router.post('/register/student', validate(registerStudentSchema), registerStudent);
router.post('/login', validate(loginSchema), login);
router.post('/refresh-token', validate(refreshTokenSchema), refreshToken);

router.post('/logout', authenticate, logout);
router.get('/me', authenticate, getMe);

export default router;
