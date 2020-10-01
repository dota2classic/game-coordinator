import { Module } from "@nestjs/common";
import { GatewayService } from "src/gateway/gateway.service";
import { CqrsModule } from "@nestjs/cqrs";
import { MmModule } from "src/mm/mm.module";

@Module({
  imports: [CqrsModule, MmModule],
  providers: [GatewayService],
})
export class GatewayModule {}
