import { Module } from "@nestjs/common";
import { MmModule } from "src/mm/mm.module";
import { GatewayModule } from "src/gateway/gateway.module";

@Module({
  imports: [MmModule, GatewayModule],
  providers: [],
})
export class AppModule {}
