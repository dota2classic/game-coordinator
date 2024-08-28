import { Module } from "@nestjs/common";
import { GatewayService } from "gateway/gateway.service";
import { CqrsModule } from "@nestjs/cqrs";
import { MmModule } from "mm/mm.module";
import { ClientsModule, Transport } from "@nestjs/microservices";
import { REDIS_HOST, REDIS_PASSWORD, REDIS_URL } from "@shared/env";
import { QueryController } from "gateway/query.controller";
import { CommandController } from "gateway/command.controller";
import { GetPlayerInfoQuery } from "gateway/gateway/queries/GetPlayerInfo/get-player-info.query";
import { outerQuery } from "gateway/gateway/util/outerQuery";
import { GetPlayerInfoQueryResult } from "gateway/gateway/queries/GetPlayerInfo/get-player-info-query.result";
import { QueryCache } from "rcache";

@Module({
  imports: [
    CqrsModule,
    MmModule,
    ClientsModule.register([
      {
        name: "RedisQueue",
        transport: Transport.REDIS,
        options: {
          host: REDIS_HOST(),
          password: REDIS_PASSWORD(),
          retryAttempts: Infinity,
          retryDelay: 3000,
        },
      },
    ]),
  ],
  controllers: [QueryController, CommandController],
  providers: [
    GatewayService,
    outerQuery(
      GetPlayerInfoQuery,
      "RedisQueue",
      new QueryCache<GetPlayerInfoQuery, GetPlayerInfoQueryResult>({
        url: REDIS_URL(),
        password: REDIS_PASSWORD(),
        ttl: 300,
      }), // 5 min caching
    ),
  ],
})
export class GatewayModule {}
