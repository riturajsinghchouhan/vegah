import dotenv from 'dotenv';
import Joi from 'joi';

// Load environment variables from .env file
dotenv.config();

const envSchema = Joi.object({
  PORT: Joi.number().default(5000),
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  TZ: Joi.string().default('Asia/Kolkata'),
  
  MONGODB_URI: Joi.string().required(),
  
  JWT_ACCESS_SECRET: Joi.string().required(),
  JWT_ACCESS_EXPIRES: Joi.string().default('7d'),
  JWT_REFRESH_SECRET: Joi.string().required(),
  JWT_REFRESH_EXPIRES: Joi.string().default('30d'),
  
  FRONTEND_URL: Joi.string().uri().required(),
  
  REDIS_ENABLED: Joi.boolean().default(true),
  REDIS_URL: Joi.string().required(),
  BULLMQ_ENABLED: Joi.boolean().default(true),
  
  RATE_LIMIT_ENABLED: Joi.boolean().default(true),
  RATE_LIMIT_WINDOW: Joi.number().default(15),
  RATE_LIMIT_MAX: Joi.number().default(3500),
  AUTH_RATE_LIMIT_WINDOW: Joi.number().default(15),
  AUTH_RATE_LIMIT_MAX: Joi.number().default(30),
  
  CLOUDINARY_CLOUD_NAME: Joi.string().allow(''),
  CLOUDINARY_API_KEY: Joi.string().allow(''),
  CLOUDINARY_API_SECRET: Joi.string().allow(''),
  UPLOAD_PATH: Joi.string().default('uploads/'),
  
  EMAIL_HOST: Joi.string().allow(''),
  EMAIL_PORT: Joi.number().default(587),
  EMAIL_USER: Joi.string().allow(''),
  EMAIL_PASS: Joi.string().allow(''),
  EMAIL_FROM: Joi.string().allow(''),
  
  GOOGLE_MAPS_API_KEY: Joi.string().allow(''),
  
  RAZORPAY_KEY_ID: Joi.string().allow(''),
  RAZORPAY_KEY_SECRET: Joi.string().allow(''),
  RAZORPAY_WEBHOOK_SECRET: Joi.string().allow(''),
  
  USE_DEFAULT_OTP: Joi.boolean().default(true),
  MSG91_AUTH_KEY: Joi.string().allow(''),
  MSG91_TEMPLATE_ID: Joi.string().allow(''),
  
  OTP_EXPIRY_MINUTES: Joi.number().default(10),
  OTP_EXPIRY_SECONDS: Joi.number().default(300),
  OTP_MAX_ATTEMPTS: Joi.number().default(3),
  OTP_RATE_LIMIT: Joi.number().default(3),
  OTP_RATE_WINDOW: Joi.number().default(600),
  
  ADMIN_REGISTRATION_CODE: Joi.string().required(),
  ADMIN_NOTIFICATION_EMAILS: Joi.string().allow(''),
  
  SOCKET_CORS_ORIGIN: Joi.string().uri().allow(''),
  
  FIREBASE_SERVICE_ACCOUNT: Joi.string().allow(''),
  VITE_FIREBASE_DATABASE_URL: Joi.string().allow(''),
  
  PASSWORD_RESET_OTP_EXPIRY_MINUTES: Joi.number().default(10),
  PASSWORD_RESET_MAX_ATTEMPTS: Joi.number().default(5),
  PASSWORD_RESET_TOKEN_EXPIRY_MINUTES: Joi.number().default(30),
}).unknown(true);

const { error, value: envVars } = envSchema.validate(process.env);

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

export default envVars;
