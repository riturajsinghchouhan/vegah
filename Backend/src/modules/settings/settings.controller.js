import * as settingsService from './settings.service.js';
import { sendSuccess } from '../../utils/response.js';

export const getSettings = async (req, res, next) => {
  try {
    const settings = await settingsService.getSettings(req.query.category);
    sendSuccess(res, 200, 'Settings fetched successfully', settings);
  } catch (error) {
    next(error);
  }
};

export const getPublicSettings = async (req, res, next) => {
  try {
    const settings = await settingsService.getSettings();
    const publicSettings = {
      termsContent: settings.termsContent || 'Terms and Conditions not yet updated.',
      privacyContent: settings.privacyContent || 'Privacy Policy not yet updated.',
      supportContent: settings.supportContent || 'Support information not yet updated.',
      // Tax & fee configuration from Admin Tax & Billing
      gstRate: Number(settings.gstRate ?? 18),
      platformFee: Number(settings.platformFee ?? 20),
      serviceCharge: Number(settings.serviceCharge ?? 5),
      cancellationFee: Number(settings.cancellationFee ?? 100),
      batteryPackageSingle: Number(settings.batteryPackageSingle ?? 50),
      batteryPackageUnlimited: Number(settings.batteryPackageUnlimited ?? 150),
    };
    sendSuccess(res, 200, 'Public settings fetched successfully', publicSettings);
  } catch (error) {
    next(error);
  }
};

export const updateSettings = async (req, res, next) => {
  try {
    const category = req.query.category;
    const updated = await settingsService.updateSettings(req.body, req.user?._id, category);
    sendSuccess(res, 200, 'Settings updated successfully', updated);
  } catch (error) {
    next(error);
  }
};
