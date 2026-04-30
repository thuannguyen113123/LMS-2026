import jwt from "jsonwebtoken";
import { jwtConfig } from "../configs/config.js";

export function generateAccessToken(payload) {
  return jwt.sign(payload, jwtConfig.accessTokenSecret, {
    expiresIn: jwtConfig.accessTokenExpiresIn,
  });
}

export function verifyAccessToken(token) {
  try {
    return jwt.verify(token, jwtConfig.accessTokenSecret);
  } catch (err) {
    return null;
  }
}

// Verify Refresh Token
export function verifyRefreshToken(token) {
  try {
    return jwt.verify(token, jwtConfig.refreshTokenSecret);
  } catch (err) {
    return null;
  }
}
