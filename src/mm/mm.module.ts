import { Module } from "@nestjs/common";
import { CqrsModule } from "@nestjs/cqrs";
import { QueueProviders } from "mm/queue";
import { PlayerProviders } from "mm/player";
import { PartyProviders } from "mm/party";
import { RoomProviders } from "mm/room";
import { PartyController } from "mm/party/party.controller";
import { ScheduleModule } from "@nestjs/schedule";

@Module({
  imports: [CqrsModule, ScheduleModule.forRoot()],
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

  controllers: [PartyController],
})
export class MmModule {}
