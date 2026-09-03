import axios from 'axios';
import env from './env.js';
import logger from '../utils/logger.js';

const sendOTP = async (mobile, otp) => {
  if (env.USE_DEFAULT_OTP) {
    logger.info(`[DEV] Default OTP generated for ${mobile}: 123456`);
    return { success: true, message: 'OTP sent (Dev mode)' };
  }

  try {
    if (!env.MSG91_AUTH_KEY || !env.MSG91_TEMPLATE_ID) {
      throw new Error('MSG91 credentials not configured');
    }

    // MSG91 Send OTP API (using SendOTP API V5)
    // Replace with exact URL/params depending on your MSG91 configuration
    const response = await axios.post(
      'https://control.msg91.com/api/v5/otp',
      {
        template_id: env.MSG91_TEMPLATE_ID,
        mobile: mobile,
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
  } catch (error) {
    logger.error(`MSG91 Error: ${error.response?.data?.message || error.message}`);
    throw new Error('Failed to send OTP via SMS provider');
  }
};

export default {
  sendOTP,
};
