import express from 'express';
import * as categoriesController from './categories.controller.js';
import * as categoriesValidation from './categories.validation.js';
import validate from '../../middleware/validate.js';
import authenticate from '../../middleware/authenticate.js';
import authorize from '../../middleware/authorize.js';

const router = express.Router();

// Require authentication for all routes
router.use(authenticate);

// Publicly readable (by authenticated users)
router.get(
  '/',
  validate(categoriesValidation.listCategoriesSchema),
  categoriesController.listCategories
);

router.get(
  '/:id',
  validate(categoriesValidation.idParamSchema),
  categoriesController.getCategoryById
);

// Admin only routes
router.use(authorize('ADMIN', 'SUPER_ADMIN'));

router.post(
  '/',
  validate(categoriesValidation.createCategorySchema),
  categoriesController.createCategory
);


router.put(
  '/:id',
  validate(categoriesValidation.updateCategorySchema),
  categoriesController.updateCategory
);

router.delete(
  '/:id',
  validate(categoriesValidation.idParamSchema),
  categoriesController.deleteCategory
);

export default router;
