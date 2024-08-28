import {queryCacheFactory} from "src/rcache";
import {REDIS_PASSWORD, REDIS_URL} from "src/@shared/env";

export const cached = queryCacheFactory({
  url: REDIS_URL(),
  password: REDIS_PASSWORD(),
  ttl: 0,
});
