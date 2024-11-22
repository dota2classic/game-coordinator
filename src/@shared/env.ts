require("dotenv").config();



export const REDIS_HOST = () => process.env.REDIS_HOST || "redis";
export const REDIS_PASSWORD = () => process.env.REDIS_PASSWORD || undefined;
export const REDIS_URL = () =>
  process.env.REDIS_URL || `redis://${REDIS_HOST()}:${6379}`;
