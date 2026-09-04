import * as inspectionsService from './inspections.service.js';
import { sendSuccess } from '../../utils/response.js';

export const listInspections = async (req, res, next) => {
  try {
    const data = await inspectionsService.listInspections(req.query);
    sendSuccess(res, 200, 'Inspections fetched successfully', data);
  } catch (error) {
    next(error);
  }
};

export const getInspectionById = async (req, res, next) => {
  try {
    const data = await inspectionsService.getInspectionById(req.params.id);
    sendSuccess(res, 200, 'Inspection details fetched successfully', data);
  } catch (error) {
    next(error);
  }
};

export const createInspection = async (req, res, next) => {
  try {
    const data = await inspectionsService.createInspection(req.body);
    sendSuccess(res, 201, 'Inspection created successfully', data);
  } catch (error) {
    next(error);
  }
};

export const updateInspection = async (req, res, next) => {
  try {
    const data = await inspectionsService.updateInspection(req.params.id, req.body);
    sendSuccess(res, 200, 'Inspection updated successfully', data);
  } catch (error) {
    next(error);
  }
};
