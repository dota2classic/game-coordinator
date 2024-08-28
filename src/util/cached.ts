import { queryCacheFactory } from "rcache";
import { REDIS_PASSWORD, REDIS_URL } from "@shared/env";

export const cached = queryCacheFactory({
  url: REDIS_URL(),
  password: REDIS_PASSWORD(),
  ttl: 0,
});
