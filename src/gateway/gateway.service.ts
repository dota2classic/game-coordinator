import { Inject, Injectable, OnApplicationBootstrap } from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import { EventBus, ofType } from "@nestjs/cqrs";
import { QueueUpdateEvent } from "src/mm/queue/event/queue-update.event";
import { map, observeOn, tap } from "rxjs/operators";
import { GatewayQueueEntry, GatewayQueueUpdatedEvent } from "src/gateway/gateway/events/gateway-queue-updated.event";
import { asyncScheduler, merge, Observable } from "rxjs";
import { PartyRepository } from "src/mm/party/repository/party.repository";
import { QueueRepository } from "src/mm/queue/repository/queue.repository";
import { asyncMap } from "rxjs-async-map";
import { QueueCreatedEvent } from "src/mm/queue/event/queue-created.event";
import { GatewayQueueCreatedEvent } from "src/gateway/gateway/events/gateway-queue-created.event";
import { inspect } from "util";

@Injectable()
export class GatewayService implements OnApplicationBootstrap {
  constructor(
    private readonly ebus: EventBus,
    private readonly partyRepository: PartyRepository,
    private readonly queueRepository: QueueRepository,
    @Inject("RedisQueue") private readonly redisEventQueue: ClientProxy,
  ) {}

  protected queueUpdated(): Observable<GatewayQueueUpdatedEvent> {
    return this.ebus.pipe(
      observeOn(asyncScheduler),
      ofType(QueueUpdateEvent),
      asyncMap(async t => {
        const q = await this.queueRepository.get(t.mode);
        return new GatewayQueueUpdatedEvent(
          t.mode,
          q.entries.map(
            t =>
              new GatewayQueueEntry(
                t.partyID,
                t.players.map(it => it.playerId),
              ),
          ),
        );
      }, 2),
    );
  }

  protected queueCreated(): Observable<GatewayQueueCreatedEvent> {
    return this.ebus.pipe(
      observeOn(asyncScheduler),
      ofType(QueueCreatedEvent),
      map(e => new GatewayQueueCreatedEvent(e.mode)),
    );
  }

  async onApplicationBootstrap() {
    try {
      await this.redisEventQueue.connect();
    } catch (e) {}

    const mappers = [this.queueUpdated(), this.queueCreated()];

    merge(...mappers).pipe(tap(e => {
      console.log(inspect(e))
    })).subscribe(t =>
      this.redisEventQueue.emit(t.constructor.name, t),
    );
  }
}
