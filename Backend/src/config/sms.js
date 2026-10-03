import axios from 'axios';
import env from './env.js';
import logger from '../utils/logger.js';

/**
 * Sends SMS via SMS Hub India API
 * @param {string} phone - Mobile number
 * @param {string} otp - OTP code
 */
const sendSmsViaSmsHub = async (phone, otp) => {
  const digits = String(phone || '').replace(/\D/g, '');
  let msisdn = digits;
  if (msisdn.length === 10) {
    msisdn = `91${msisdn}`;
  } else if (!msisdn.startsWith('91')) {
    msisdn = `91${msisdn}`;
  }

  const url = new URL('http://cloud.smsindiahub.in/vendorsms/pushsms.aspx');
  url.searchParams.append('APIKey', env.SMSHUB_API_KEY || '');
  url.searchParams.append('sid', env.SMSHUB_SENDER_ID || 'BGADPL');
  url.searchParams.append('msisdn', msisdn);
  url.searchParams.append('fl', '0');
  url.searchParams.append('gwid', '2');

  // Approved DLT template message format for Vegah (exact match from DLT portal)
  const message = `Welcome to Vegah powered by Appzeto. Your OTP for registration ${otp}. This OTP is valid for 10 minutes. Please do not share it with anyone.BGADPL`;
  url.searchParams.append('msg', message);

  if (env.SMSHUB_TEMPLATE_ID) {
    url.searchParams.append('templateid', env.SMSHUB_TEMPLATE_ID);
  }
  if (env.SMSHUB_ENTITY_ID) {
    url.searchParams.append('EntityID', env.SMSHUB_ENTITY_ID);
  }

  logger.info(`[SMS] Sending OTP to ${msisdn} via SMS Hub India...`);

  const response = await axios.get(url.toString());
  const responseData = response.data;
  logger.info(`[SMS] Raw response for ${msisdn}: ${JSON.stringify(responseData)}`);

  let isSuccess = false;
  if (typeof responseData === 'object' && responseData !== null) {
    if (responseData.ErrorCode === '000' || responseData.ErrorMessage === 'Done') {
      isSuccess = true;
    }
  } else if (typeof responseData === 'string' && (responseData.includes('ErrorCode="000"') || responseData.includes('Done'))) {
    isSuccess = true;
  }

  if (!isSuccess) {
    logger.error(`SMS Hub ERROR for ${phone}: ${JSON.stringify(responseData)}`);
    throw new Error('Failed to send OTP via SMS Hub India');
  }

  logger.info(`✅ SMS sent successfully to ${msisdn} via SMS Hub India`);
  return { success: true, data: responseData };
};

/**
 * Sends SMS via MSG91 API
 * @param {string} phone - Mobile number
 * @param {string} otp - OTP code
 */
const sendSmsViaMsg91 = async (phone, otp) => {
  if (!env.MSG91_AUTH_KEY || !env.MSG91_TEMPLATE_ID) {
    throw new Error('MSG91 credentials not configured');
  }

  const response = await axios.post(
    'https://control.msg91.com/api/v5/otp',
    {
      template_id: env.MSG91_TEMPLATE_ID,
      mobile: phone,
      otp: otp,
    },
    {
      headers: {
        authkey: env.MSG91_AUTH_KEY,
        'Content-Type': 'application/json',
      },
    }
  );

  return { success: true, data: response.data };
};

/**
 * Primary OTP dispatcher based on SMS_PROVIDER setting
 * @param {string} mobile - Mobile number
 * @param {string} otp - OTP code
 */
export const sendOTP = async (mobile, otp) => {
  if (env.USE_DEFAULT_OTP) {
    logger.info(`[DEV] Default OTP active for ${mobile}: ${otp}`);
    return { success: true, message: 'OTP sent (Dev mode)' };
  }

  try {
    const provider = env.SMS_PROVIDER || 'smshub';
    if (provider === 'smshub') {
      return await sendSmsViaSmsHub(mobile, otp);
    } else if (provider === 'msg91') {
      return await sendSmsViaMsg91(mobile, otp);
    } else {
      throw new Error(`Unsupported SMS Provider: ${provider}`);
    }
  } catch (error) {
    logger.error(`SMS Provider Error: ${error.message}`);
    throw new Error(`Failed to send OTP via SMS provider: ${error.message}`);
  }
};

const smsService = {
  sendOTP,
  sendSmsViaSmsHub,
  sendSmsViaMsg91,
};

export default smsService;
