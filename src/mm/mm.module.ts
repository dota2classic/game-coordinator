import { Module } from "@nestjs/common";
import { CqrsModule } from "@nestjs/cqrs";
import { QueueProviders } from "src/mm/queue";
import { PlayerProviders } from "src/mm/player";
import { PartyProviders } from "src/mm/party";

@Module({
  imports: [CqrsModule],
  providers: [...QueueProviders, ...PlayerProviders, ...PartyProviders],
})
export class MmModule {}
