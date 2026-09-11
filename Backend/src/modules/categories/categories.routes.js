import express from 'express';
import * as categoriesController from './categories.controller.js';
import * as categoriesValidation from './categories.validation.js';
import validate from '../../middleware/validate.js';
import authenticate from '../../middleware/authenticate.js';
import authorize from '../../middleware/authorize.js';

const router = express.Router();

// Publicly readable (categories list & details)
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

// Admin only write operations
router.use(authenticate, authorize('ADMIN', 'SUPER_ADMIN'));

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
