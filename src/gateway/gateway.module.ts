import {Module} from "@nestjs/common";
import {GatewayService} from "src/gateway/gateway.service";
import {CqrsModule} from "@nestjs/cqrs";
import {MmModule} from "src/mm/mm.module";
import {ClientsModule, Transport} from "@nestjs/microservices";
import {REDIS_PASSWORD, REDIS_URL} from "src/@shared/env";
import {QueryController} from "src/gateway/query.controller";
import {CommandController} from "src/gateway/command.controller";
import {GetPlayerInfoQuery} from "src/gateway/gateway/queries/GetPlayerInfo/get-player-info.query";
import {outerQuery} from "src/gateway/gateway/util/outerQuery";
import {QueryCache} from "src/gateway/query-cache";
import {GetPlayerInfoQueryResult} from "src/gateway/gateway/queries/GetPlayerInfo/get-player-info-query.result";

@Module({
  imports: [
    CqrsModule,
    MmModule,
    ClientsModule.register([
      {
        name: "RedisQueue",
        transport: Transport.REDIS,
        options: {
          url: REDIS_URL(),
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
      new QueryCache<GetPlayerInfoQuery, GetPlayerInfoQueryResult>(300), // 5 min caching
    ),
  ],
})
export class GatewayModule {}
