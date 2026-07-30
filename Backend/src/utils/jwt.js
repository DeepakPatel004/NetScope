import jwt from 'jsonwebtoken';

const ACCESS_EXP = process.env.ACCESS_TOKEN_EXPIRES || '15m';
const REFRESH_EXP = process.env.REFRESH_TOKEN_EXPIRES || '30d';
const SECRET = process.env.JWT_SECRET || 'change-me';

export const signAccessToken = (payload) => {
  return jwt.sign({ role: payload.role }, SECRET, { subject: payload.sub, expiresIn: ACCESS_EXP });
};

export const signRefreshToken = (payload) => {
  return jwt.sign({}, SECRET, { subject: payload.sub, expiresIn: REFRESH_EXP });
};

export const verifyRefreshToken = (token) => {
  return jwt.verify(token, SECRET);
};
