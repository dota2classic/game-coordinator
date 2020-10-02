import { Module } from "@nestjs/common";
import { CqrsModule } from "@nestjs/cqrs";
import { GatewayService } from "src/gateway/gateway.service";
import { MmModule } from "src/mm/mm.module";
import { GatewayModule } from "src/gateway/gateway.module";

@Module({
  imports: [
    MmModule,
    GatewayModule,

  ],
  providers: [],
})
export class AppModule {}
