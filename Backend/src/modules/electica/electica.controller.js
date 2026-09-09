import * as electicaService from './electica.service.js';
import { sendSuccess } from '../../utils/response.js';

export const getStations = async (req, res, next) => {
  try {
    const stations = await electicaService.getStations();
    sendSuccess(res, 200, 'Stations fetched successfully', stations);
  } catch (error) {
    next(error);
  }
};

export const getStation = async (req, res, next) => {
  try {
    const stationId = req.params.id || req.query.id;
    const station = await electicaService.getStation(stationId);
    sendSuccess(res, 200, 'Station fetched successfully', station);
  } catch (error) {
    next(error);
  }
};

export const getPods = async (req, res, next) => {
  try {
    const stationId = req.params.id || req.query.stationId;
    const pods = await electicaService.getPods(stationId);
    sendSuccess(res, 200, 'Pods fetched successfully', pods);
  } catch (error) {
    next(error);
  }
};

export const getBatteries = async (req, res, next) => {
  try {
    const batteries = await electicaService.getBatteries();
    sendSuccess(res, 200, 'Batteries fetched successfully', batteries);
  } catch (error) {
    next(error);
  }
};

export const getBattery = async (req, res, next) => {
  try {
    const { id } = req.params;
    const battery = await electicaService.getBattery(id);
    sendSuccess(res, 200, 'Battery fetched successfully', battery);
  } catch (error) {
    next(error);
  }
};

export const getBatteryTelemetry = async (req, res, next) => {
  try {
    const { id } = req.params;
    const limit = req.query.limit || 100;
    const telemetry = await electicaService.getBatteryTelemetry(id, limit);
    sendSuccess(res, 200, 'Battery telemetry fetched successfully', telemetry);
  } catch (error) {
    next(error);
  }
};

export const getLatestTelemetry = async (req, res, next) => {
  try {
    const { id } = req.params;
    const latestTelemetry = await electicaService.getLatestTelemetry(id);
    sendSuccess(res, 200, 'Latest battery telemetry fetched successfully', latestTelemetry);
  } catch (error) {
    next(error);
  }
};

export const getSwaps = async (req, res, next) => {
  try {
    const limit = req.query.limit || 100;
    const swaps = await electicaService.getSwaps(limit);
    sendSuccess(res, 200, 'Swaps fetched successfully', swaps);
  } catch (error) {
    next(error);
  }
};
