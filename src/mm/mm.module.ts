import { Module } from "@nestjs/common";
import { CqrsModule } from "@nestjs/cqrs";
import { QueueProviders } from "src/mm/queue";
import { PlayerProviders } from "src/mm/player";
import { PartyProviders } from "src/mm/party";
import { RoomProviders } from "src/mm/room";

@Module({
  imports: [CqrsModule],
  providers: [
    ...QueueProviders,
    ...PlayerProviders,
    ...PartyProviders,
    ...RoomProviders,
  ],
  exports: [
    ...QueueProviders,
    ...PlayerProviders,
    ...PartyProviders,
    ...RoomProviders,
  ],
})
export class MmModule {}
