import * as inventoryService from './inventory.service.js';
import { sendSuccess } from '../../utils/response.js';

export const updateVehicleStatus = async (req, res, next) => {
  try {
    const vehicle = await inventoryService.updateVehicleStatus(req.params.id, req.body.status);
    sendSuccess(res, 200, `Vehicle status updated to ${vehicle.status}`, vehicle);
  } catch (error) {
    next(error);
  }
};

export const getZoneAvailability = async (req, res, next) => {
  try {
    const result = await inventoryService.getZoneAvailability(req.params.zoneId);
    sendSuccess(res, 200, 'Zone availability fetched', result);
  } catch (error) {
    next(error);
  }
};

export const getAllZonesAvailability = async (req, res, next) => {
  try {
    const result = await inventoryService.getAllZonesAvailability();
    sendSuccess(res, 200, 'All zones availability fetched', result);
  } catch (error) {
    next(error);
  }
};

export const getInventorySummary = async (req, res, next) => {
  try {
    const result = await inventoryService.getInventorySummary();
    sendSuccess(res, 200, 'Inventory summary fetched', result);
  } catch (error) {
    next(error);
  }
};
