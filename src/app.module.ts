import { Module } from "@nestjs/common";
import { MmModule } from "./mm/mm.module";
import { ClientsModule, Transport } from "@nestjs/microservices";

@Module({
  imports: [
    MmModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}