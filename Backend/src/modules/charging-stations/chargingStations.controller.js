import * as chargingStationsService from './chargingStations.service.js';
import { sendSuccess } from '../../utils/response.js';

export const listChargingStations = async (req, res, next) => {
  try {
    const result = await chargingStationsService.listChargingStations(req.query);
    sendSuccess(res, 200, 'Charging stations fetched successfully', result.stations, result.meta);
  } catch (error) {
    next(error);
  }
};

export const getChargingStationById = async (req, res, next) => {
  try {
    const station = await chargingStationsService.getChargingStationById(req.params.id);
    sendSuccess(res, 200, 'Charging station fetched successfully', station);
  } catch (error) {
    next(error);
  }
};

export const createChargingStation = async (req, res, next) => {
  try {
    const station = await chargingStationsService.createChargingStation(req.body);
    sendSuccess(res, 201, 'Charging station created successfully', station);
  } catch (error) {
    next(error);
  }
};

export const updateChargingStation = async (req, res, next) => {
  try {
    const station = await chargingStationsService.updateChargingStation(req.params.id, req.body);
    sendSuccess(res, 200, 'Charging station updated successfully', station);
  } catch (error) {
    next(error);
  }
};

export const deleteChargingStation = async (req, res, next) => {
  try {
    await chargingStationsService.deleteChargingStation(req.params.id);
    sendSuccess(res, 200, 'Charging station deleted successfully');
  } catch (error) {
    next(error);
  }
};
