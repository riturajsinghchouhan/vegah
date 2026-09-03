import express from 'express';
import * as vehiclesController from './vehicles.controller.js';
import * as vehiclesValidation from './vehicles.validation.js';
import validate from '../../middleware/validate.js';
import authenticate from '../../middleware/authenticate.js';
import authorize from '../../middleware/authorize.js';
import { upload } from '../../config/cloudinary.js';

const router = express.Router();

// Publicly accessible list route (for users)
// Note: We'll keep it public or user auth depending on requirements, let's say user auth for booking
// For now, let's keep GET / and GET /:id authenticated as USER or ADMIN
router.get(
  '/',
  authenticate,
  validate(vehiclesValidation.listVehiclesSchema),
  vehiclesController.listVehicles
);

router.get(
  '/:id',
  authenticate,
  validate(vehiclesValidation.idParamSchema),
  vehiclesController.getVehicleById
);

// Admin only routes
router.use(authenticate, authorize('ADMIN', 'SUPER_ADMIN'));

router.post(
  '/',
  upload.array('images', 5), // Max 5 images
  // validate(vehiclesValidation.createVehicleSchema), 
  // Validation with multipart/form-data requires special handling or validating req.body after parsing
  // We'll skip deep Joi validation here or parse body strings to JSON before validation
  (req, res, next) => {
    // Parse nested objects sent as JSON strings in formData
    if (req.body.coordinates && typeof req.body.coordinates === 'string') {
      req.body.coordinates = JSON.parse(req.body.coordinates);
    }
    if (req.body.features && typeof req.body.features === 'string') {
      req.body.features = JSON.parse(req.body.features);
    }
    next();
  },
  validate(vehiclesValidation.createVehicleSchema),
  vehiclesController.createVehicle
);

router.put(
  '/:id',
  upload.array('images', 5),
  (req, res, next) => {
    if (req.body.coordinates && typeof req.body.coordinates === 'string') {
      req.body.coordinates = JSON.parse(req.body.coordinates);
    }
    if (req.body.features && typeof req.body.features === 'string') {
      req.body.features = JSON.parse(req.body.features);
    }
    next();
  },
  validate(vehiclesValidation.updateVehicleSchema),
  vehiclesController.updateVehicle
);

router.delete(
  '/:id',
  validate(vehiclesValidation.idParamSchema),
  vehiclesController.deleteVehicle
);

router.delete(
  '/:id/images/:imageId',
  vehiclesController.deleteVehicleImage
);

export default router;
