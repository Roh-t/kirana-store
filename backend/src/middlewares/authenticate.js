import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { ApiError } from '../utils/apiError.js';
import { User } from '../modules/users/user.model.js';

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw ApiError.unauthorized('Access denied. No authentication token provided.');
    }

    const token = authHeader.split(' ')[1];
    let decoded;

    try {
      decoded = jwt.verify(token, env.jwtSecret);
    } catch (err) {
      throw ApiError.unauthorized('Invalid or expired token. Please log in again.');
    }

    const user = await User.findById(decoded.sub).populate('roles.roleId');

    if (!user || user.status !== 'ACTIVE') {
      throw ApiError.unauthorized('User account is inactive or no longer exists.');
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};