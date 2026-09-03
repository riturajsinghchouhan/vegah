import * as vehiclesService from './vehicles.service.js';
import { sendSuccess } from '../../utils/response.js';

export const createVehicle = async (req, res, next) => {
  try {
    const vehicle = await vehiclesService.createVehicle(req.body, req.files);
    sendSuccess(res, 201, 'Vehicle created successfully', vehicle);
  } catch (error) {
    next(error);
  }
};

export const updateVehicle = async (req, res, next) => {
  try {
    const vehicle = await vehiclesService.updateVehicle(req.params.id, req.body, req.files);
    sendSuccess(res, 200, 'Vehicle updated successfully', vehicle);
  } catch (error) {
    next(error);
  }
};

export const getVehicleById = async (req, res, next) => {
  try {
    const vehicle = await vehiclesService.getVehicleById(req.params.id);
    sendSuccess(res, 200, 'Vehicle fetched successfully', vehicle);
  } catch (error) {
    next(error);
  }
};

export const listVehicles = async (req, res, next) => {
  try {
    const result = await vehiclesService.listVehicles(req.query);
    sendSuccess(res, 200, 'Vehicles fetched successfully', result.vehicles, result.meta);
  } catch (error) {
    next(error);
  }
};

export const deleteVehicle = async (req, res, next) => {
  try {
    await vehiclesService.deleteVehicle(req.params.id);
    sendSuccess(res, 200, 'Vehicle deleted successfully');
  } catch (error) {
    next(error);
  }
};

export const deleteVehicleImage = async (req, res, next) => {
  try {
    const vehicle = await vehiclesService.deleteVehicleImage(req.params.id, req.params.imageId);
    sendSuccess(res, 200, 'Image deleted successfully', vehicle);
  } catch (error) {
    next(error);
  }
};
