import express from 'express';
import * as usersController from './users.controller.js';
import * as usersValidation from './users.validation.js';
import validate from '../../middleware/validate.js';
import authenticate from '../../middleware/authenticate.js';
import authorize from '../../middleware/authorize.js';

const router = express.Router();

router.use(authenticate);

// User endpoints
router.get(
  '/me',
  usersController.getUserById
);

router.patch(
  '/profile',
  validate(usersValidation.updateProfileSchema),
  usersController.updateProfile
);

// Admin endpoints
router.use(authorize('ADMIN', 'SUPER_ADMIN'));

router.get(
  '/',
  validate(usersValidation.listUsersSchema),
  usersController.listUsers
);

router.get(
  '/:id',
  validate(usersValidation.idParamSchema),
  usersController.getUserById
);

router.patch(
  '/:id/block',
  validate(usersValidation.idParamSchema),
  usersController.blockUser
);

router.patch(
  '/:id/unblock',
  validate(usersValidation.idParamSchema),
  usersController.unblockUser
);

export default router;
