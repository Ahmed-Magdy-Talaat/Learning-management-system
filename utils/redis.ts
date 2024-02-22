import { Redis } from "ioredis";

require("dotenv").config();

const clientRedis = () => {
  const redisUrl = process.env.REDIS_URL;
  if (redisUrl) {
    return redisUrl;
  } else {
    throw new Error("Redis connection failed");
  }
};

const redis = new Redis(clientRedis());

export default redis;
