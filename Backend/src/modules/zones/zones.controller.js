import * as zonesService from './zones.service.js';
import { sendSuccess } from '../../utils/response.js';

export const createZone = async (req, res, next) => {
  try {
    const zone = await zonesService.createZone(req.body);
    sendSuccess(res, 201, 'Zone created successfully', zone);
  } catch (error) {
    next(error);
  }
};

export const updateZone = async (req, res, next) => {
  try {
    const zone = await zonesService.updateZone(req.params.id, req.body);
    sendSuccess(res, 200, 'Zone updated successfully', zone);
  } catch (error) {
    next(error);
  }
};

export const getZoneById = async (req, res, next) => {
  try {
    const zone = await zonesService.getZoneById(req.params.id);
    sendSuccess(res, 200, 'Zone fetched successfully', zone);
  } catch (error) {
    next(error);
  }
};

export const listZones = async (req, res, next) => {
  try {
    const result = await zonesService.listZones(req.query);
    sendSuccess(res, 200, 'Zones fetched successfully', result.zones, result.meta);
  } catch (error) {
    next(error);
  }
};

export const deleteZone = async (req, res, next) => {
  try {
    await zonesService.deleteZone(req.params.id);
    sendSuccess(res, 200, 'Zone deleted successfully');
  } catch (error) {
    next(error);
  }
};
