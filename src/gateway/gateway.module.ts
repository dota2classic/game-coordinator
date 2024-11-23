import { Module } from "@nestjs/common";
import { GatewayService } from "gateway/gateway.service";
import { CqrsModule } from "@nestjs/cqrs";
import { MmModule } from "mm/mm.module";
import { ClientsModule, MicroserviceOptions, RedisOptions, Transport } from "@nestjs/microservices";
import { QueryController } from "gateway/query.controller";
import { CommandController } from "gateway/command.controller";
import { GetPlayerInfoQuery } from "gateway/gateway/queries/GetPlayerInfo/get-player-info.query";
import { outerQuery } from "gateway/gateway/util/outerQuery";
import { QueryCache } from "rcache";
import { GetSessionByUserQuery } from "./gateway/queries/GetSessionByUser/get-session-by-user.query";
import { ConfigService } from "@nestjs/config";
import { outerQueryNew } from "../util/outerQueryNew";

export function qCache<T, B>(host: string, password: string) {
  return new QueryCache<T, B>({
    url: `redis://${host}:6379`,
    password: password,
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

    outerQueryNew(GetPlayerInfoQuery, "RedisQueue", qCache),
    outerQueryNew(GetSessionByUserQuery, "RedisQueue", qCache),
  ],
})
export class GatewayModule {}
