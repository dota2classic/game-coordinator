import {
  Inject,
  Injectable,
  OnApplicationBootstrap,
  Type,
} from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import { EventBus, ofType, QueryBus } from "@nestjs/cqrs";
import { QueueUpdatedEvent } from "gateway/gateway/events/queue-updated.event";
import { PartyRepository } from "mm/party/repository/party.repository";
import { QueueRepository } from "mm/queue/repository/queue.repository";
import { QueueCreatedEvent } from "gateway/gateway/events/queue-created.event";
import { ReadyCheckStartedEvent } from "gateway/gateway/events/ready-check-started.event";
import { ReadyStateUpdatedEvent } from "gateway/gateway/events/ready-state-updated.event";
import { RoomReadyCheckCompleteEvent } from "gateway/gateway/events/room-ready-check-complete.event";
import { RoomReadyEvent } from "gateway/gateway/events/room-ready.event";
import { RoomNotReadyEvent } from "gateway/gateway/events/room-not-ready.event";
import { PartyInviteExpiredEvent } from "gateway/gateway/events/party/party-invite-expired.event";
import { PartyInviteCreatedEvent } from "gateway/gateway/events/party/party-invite-created.event";
import { PartyUpdatedEvent } from "gateway/gateway/events/party/party-updated.event";
import { PartyInviteResultEvent } from "gateway/gateway/events/party/party-invite-result.event";
import { MatchmakingBannedEvent } from "gateway/gateway/events/matchmaking-banned.event";
import { RoomImpossibleEvent } from "gateway/gateway/events/mm/room-impossible.event";
import { EnterQueueDeclinedEvent } from "gateway/gateway/events/mm/enter-queue-declined.event";
import { EnterRankedQueueDeclinedEvent } from "gateway/gateway/events/mm/enter-ranked-queue-declined.event";
import { PlayerDeclinedGameEvent } from "gateway/gateway/events/mm/player-declined-game.event";
import { LogEvent } from "gateway/gateway/events/log.event";
import { PartyQueueStateUpdatedEvent } from "./gateway/events/mm/party-queue-state-updated.event";

@Injectable()
export class GatewayService implements OnApplicationBootstrap {
  constructor(
    private readonly ebus: EventBus,
    private readonly qbus: QueryBus,
    private readonly partyRepository: PartyRepository,
    private readonly queueRepository: QueueRepository,
    @Inject("RedisQueue") private readonly redisEventQueue: ClientProxy,
  ) {}

  async onApplicationBootstrap() {
    try {
      await this.redisEventQueue.connect();
    } catch (e) {}

    // events to publish to global
    const publicEvents: Type<any>[] = [
      QueueCreatedEvent,
      QueueUpdatedEvent,
      ReadyStateUpdatedEvent,
      ReadyCheckStartedEvent,
      RoomReadyCheckCompleteEvent,
      RoomReadyEvent,
      RoomNotReadyEvent,

      PartyInviteExpiredEvent,
      PartyInviteCreatedEvent,
      PartyUpdatedEvent,
      PartyInviteResultEvent,

      RoomImpossibleEvent,
      MatchmakingBannedEvent,
      LogEvent,

      EnterQueueDeclinedEvent,
      EnterRankedQueueDeclinedEvent,
      PlayerDeclinedGameEvent,
      PartyQueueStateUpdatedEvent
    ];
    this.ebus
      .pipe(ofType(...publicEvents))
      .subscribe((t) => this.redisEventQueue.emit(t.constructor.name, t));
  }
}
