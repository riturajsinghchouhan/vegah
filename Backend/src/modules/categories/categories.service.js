import Category from '../../models/Category.js';
import { NotFoundError, ConflictError } from '../../utils/errors.js';

export const createCategory = async (data) => {
  const existingCategory = await Category.findOne({ name: data.name, deletedAt: null });
  if (existingCategory) {
    throw new ConflictError('Category with this name already exists');
  }

  const category = await Category.create(data);
  return category;
};

export const updateCategory = async (id, data) => {
  if (data.name) {
    const existingCategory = await Category.findOne({ name: data.name, _id: { $ne: id }, deletedAt: null });
    if (existingCategory) {
      throw new ConflictError('Category with this name already exists');
    }
  }

  const category = await Category.findOneAndUpdate(
    { _id: id, deletedAt: null },
    { $set: data },
    { new: true }
  );

  if (!category) {
    throw new NotFoundError('Category not found');
  }

  return category;
};

export const getCategoryById = async (id) => {
  const category = await Category.findOne({ _id: id, deletedAt: null });
  if (!category) {
    throw new NotFoundError('Category not found');
  }
  return category;
};

export const listCategories = async (query) => {
  const { page = 1, limit = 20, status, search } = query;
  
  const filter = { deletedAt: null };
  
  if (status) {
    filter.status = status;
  }
  
  if (search) {
    filter.name = { $regex: search, $options: 'i' };
  }

  const skip = (page - 1) * limit;

  const [categories, total] = await Promise.all([
    Category.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Category.countDocuments(filter)
  ]);

  return {
    categories,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const deleteCategory = async (id) => {
  const category = await Category.findOneAndUpdate(
    { _id: id, deletedAt: null },
    { $set: { deletedAt: new Date(), status: 'INACTIVE' } },
    { new: true }
  );

  if (!category) {
    throw new NotFoundError('Category not found');
  }

  return category;
};
