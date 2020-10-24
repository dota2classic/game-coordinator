import { Module } from "@nestjs/common";
import { GatewayService} from "src/gateway/gateway.service";
import { CqrsModule } from "@nestjs/cqrs";
import { MmModule } from "src/mm/mm.module";
import { ClientsModule, Transport } from "@nestjs/microservices";
import { REDIS_URL } from "src/@shared/env";
import { QueryController } from "src/gateway/query.controller";
import { CommandController } from "src/gateway/command.controller";
import { GetPlayerInfoQuery } from "src/gateway/gateway/queries/GetPlayerInfo/get-player-info.query";
import {queryTransmitter} from "src/gateway/queryTransmitter";

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
        },
      },
    ]),
  ],
  controllers: [QueryController, CommandController],
  providers: [GatewayService, queryTransmitter(GetPlayerInfoQuery)],
})
export class GatewayModule {}
