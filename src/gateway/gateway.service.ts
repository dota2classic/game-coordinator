import {Inject, Injectable, OnApplicationBootstrap} from "@nestjs/common";
import {ClientProxy} from "@nestjs/microservices";
import {EventBus, ofType} from "@nestjs/cqrs";
import {QueueUpdatedEvent} from "src/gateway/gateway/events/queue-updated.event";
import {PartyRepository} from "src/mm/party/repository/party.repository";
import {QueueRepository} from "src/mm/queue/repository/queue.repository";
import {QueueCreatedEvent} from "src/gateway/gateway/events/queue-created.event";
import {ReadyCheckStartedEvent} from "src/gateway/gateway/events/ready-check-started.event";

@Injectable()
export class GatewayService implements OnApplicationBootstrap {
  constructor(
    private readonly ebus: EventBus,
    private readonly partyRepository: PartyRepository,
    private readonly queueRepository: QueueRepository,
    @Inject("RedisQueue") private readonly redisEventQueue: ClientProxy,
  ) {}

  async onApplicationBootstrap() {
    try {
      await this.redisEventQueue.connect();
    } catch (e) {}

    const publicEvents: any[] = [
      QueueCreatedEvent,
      QueueUpdatedEvent,
      ReadyCheckStartedEvent,
    ];
    this.ebus
      .pipe(ofType(...publicEvents))
      .subscribe(t => this.redisEventQueue.emit(t.constructor.name, t));
  }
}
