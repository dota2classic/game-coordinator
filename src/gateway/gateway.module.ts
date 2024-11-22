import { Module } from "@nestjs/common";
import { GatewayService } from "gateway/gateway.service";
import { CqrsModule } from "@nestjs/cqrs";
import { MmModule } from "mm/mm.module";
import { ClientsModule, MicroserviceOptions, RedisOptions, Transport } from "@nestjs/microservices";
import { REDIS_PASSWORD, REDIS_URL } from "@shared/env";
import { QueryController } from "gateway/query.controller";
import { CommandController } from "gateway/command.controller";
import { GetPlayerInfoQuery } from "gateway/gateway/queries/GetPlayerInfo/get-player-info.query";
import { outerQuery } from "gateway/gateway/util/outerQuery";
import { QueryCache } from "rcache";
import { GetSessionByUserQuery } from "./gateway/queries/GetSessionByUser/get-session-by-user.query";
import { ConfigService } from "@nestjs/config";

export function qCache<T, B>() {
  return new QueryCache<T, B>({
    url: REDIS_URL(),
    password: REDIS_PASSWORD(),
    ttl: 10,
  });
}

@Module({
  imports: [
    CqrsModule,
    MmModule,
    ClientsModule.registerAsync([
      {
        name: "RedisQueue",
        useFactory(config: ConfigService): RedisOptions {
          return {
            transport: Transport.REDIS,
            options: {
              host: config.get("redis.host"),
              password: config.get("redis.password"),
            },
          };
        },
        inject: [ConfigService],
        imports: [],
      },
    ]),
  ],
  controllers: [QueryController, CommandController],
  providers: [
    GatewayService,
    outerQuery(GetPlayerInfoQuery, "RedisQueue", qCache()),
    outerQuery(GetSessionByUserQuery, "RedisQueue", qCache()),
  ],
})
export class GatewayModule {}
