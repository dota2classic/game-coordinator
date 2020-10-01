import { Module } from "@nestjs/common";
import { CqrsModule } from "@nestjs/cqrs";
import { QueueProviders } from "src/mm/queue";
import { PlayerProviders } from "src/mm/player";
import { PartyProviders } from "src/mm/party";
import { RoomProviders } from "src/mm/room";
import { GatewayService } from "src/mm/gateway.service";
import { ClientsModule, Transport } from "@nestjs/microservices";

@Module({
  imports: [
    CqrsModule,
    ClientsModule.register([
      {
        name: "DiscordGateway",
        transport: Transport.TCP,
        options: { port: 5001 },
      },
    ]),
  ],
  providers: [
    GatewayService,
    ...QueueProviders,
    ...PlayerProviders,
    ...PartyProviders,
    ...RoomProviders,
  ],
})
export class MmModule {}
