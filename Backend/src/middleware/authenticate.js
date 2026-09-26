import jwt from 'jsonwebtoken';
import { UnauthorizedError } from '../utils/errors.js';
import env from '../config/env.js';

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new UnauthorizedError('Access token is missing or invalid'));
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);
    // The JWT payload uses `id`. `_id` is mirrored onto it because several
    // controllers reach for the Mongoose-style name and silently got undefined.
    req.user = { ...decoded, _id: decoded.id };
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return next(new UnauthorizedError('Access token has expired'));
    }
    return next(new UnauthorizedError('Invalid access token'));
  }
};

export default authenticate;
