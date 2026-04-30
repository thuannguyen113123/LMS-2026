import dotenv from "dotenv";
dotenv.config();

export const jwtConfig = {
  accessTokenSecret: process.env.JWT_ACCESS_SECRET || "fallback_secret",
  refreshTokenSecret:
    process.env.JWT_REFRESH_SECRET || "fallback_refresh_secret",
  accessTokenExpiresIn: process.env.JWT_EXPIRES_IN || "3h",
  refreshTokenExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
};
