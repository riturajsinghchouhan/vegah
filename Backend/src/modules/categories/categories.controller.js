import * as categoriesService from './categories.service.js';
import { sendSuccess } from '../../utils/response.js';

export const createCategory = async (req, res, next) => {
  try {
    const category = await categoriesService.createCategory(req.body);
    sendSuccess(res, 201, 'Category created successfully', category);
  } catch (error) {
    next(error);
  }
};

export const updateCategory = async (req, res, next) => {
  try {
    const category = await categoriesService.updateCategory(req.params.id, req.body);
    sendSuccess(res, 200, 'Category updated successfully', category);
  } catch (error) {
    next(error);
  }
};

export const getCategoryById = async (req, res, next) => {
  try {
    const category = await categoriesService.getCategoryById(req.params.id);
    sendSuccess(res, 200, 'Category fetched successfully', category);
  } catch (error) {
    next(error);
  }
};

export const listCategories = async (req, res, next) => {
  try {
    const result = await categoriesService.listCategories(req.query);
    sendSuccess(res, 200, 'Categories fetched successfully', result.categories, result.meta);
  } catch (error) {
    next(error);
  }
};

export const deleteCategory = async (req, res, next) => {
  try {
    await categoriesService.deleteCategory(req.params.id);
    sendSuccess(res, 200, 'Category deleted successfully');
  } catch (error) {
    next(error);
  }
};
