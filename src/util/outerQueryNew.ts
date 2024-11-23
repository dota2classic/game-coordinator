import { IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import { ClientProxy } from "@nestjs/microservices";
import { Logger, Type } from "@nestjs/common";
import { performance } from "perf_hooks";
import { timeout } from "rxjs/operators";
import { ConfigService } from "@nestjs/config";

export interface CacheMiddleware<T, B> {
  getCached(query: T): Promise<B | undefined>;
  setNew(query: T, value: B): Promise<void>;
}

export function outerQueryNew<T, B>(
  type: Type<T>,
  provide = "RedisQueue",
  cacheFactory?: (host: string, password: string) => CacheMiddleware<T, B>,
): any {
  // Small trick to set class.name dynamically, it is needed for nestjs
  const ClassName = `${type.name}Handler`;
  const context = {
    [ClassName]: class implements IQueryHandler<T, B> {
      private readonly logger = new Logger(ClassName);
      private cache: CacheMiddleware<T, B>;
      constructor(private readonly redis: ClientProxy, private readonly config: ConfigService) {
        this.cache = cacheFactory(config.get('redis.host'), config.get('redis.password'))
      }

      async execute(query: T): Promise<B> {
        const cached = await this.cache
          // @ts-ignore
          .getCached([type.name, [query]])
          .catch((e) => {
            console.error("nooo", e);
          });
        if (cached) {
          return cached;
        }
        const time = performance.now();

        try {
          return await this.redis
            .send<B>(type.name, query)
            .pipe(timeout(5000))
            .toPromise();
        } catch (e) {
          this.logger.error(e);
        } finally {
          const newTime = performance.now();

          if (newTime - time > 1000) {
            this.logger.warn(`${type.name} took ${newTime - time} to finish`);
          }
        }

        return undefined;
      }
    },
  };

  QueryHandler(type)(context[ClassName]);

  return {
    provide: context[ClassName],
    useFactory(core: ClientProxy, config: ConfigService) {
      return new context[ClassName](core, config);
    },
    inject: [provide, ConfigService],
  };
}
