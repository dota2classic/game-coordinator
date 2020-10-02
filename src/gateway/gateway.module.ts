import { Module } from "@nestjs/common";
import { GatewayService } from "src/gateway/gateway.service";
import { CqrsModule } from "@nestjs/cqrs";
import { MmModule } from "src/mm/mm.module";
import { ClientsModule, Transport } from "@nestjs/microservices";
import { REDIS_URL } from "src/@shared/env";

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
  providers: [GatewayService],
})
export class GatewayModule {}
