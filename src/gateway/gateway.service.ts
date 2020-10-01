import { Injectable, OnApplicationBootstrap } from "@nestjs/common";
import { Client, ClientProxy, Transport } from "@nestjs/microservices";
import { EventBus, ofType } from "@nestjs/cqrs";
import { QueueUpdateEvent } from "src/mm/queue/event/queue-update.event";
import { observeOn, tap } from "rxjs/operators";
import { GatewayQueueEntry, GatewayQueueUpdatedEvent } from "src/gateway/events/gateway-queue-updated.event";
import { asyncScheduler } from "rxjs";
import { PartyRepository } from "src/mm/party/repository/party.repository";
import { QueueRepository } from "src/mm/queue/repository/queue.repository";
import { asyncMap } from "rxjs-async-map";

@Injectable()
export class GatewayService implements OnApplicationBootstrap {
  constructor(
    private readonly ebus: EventBus,
    private readonly partyRepository: PartyRepository,
    private readonly queueRepository: QueueRepository,
  ) {}

  @Client({ transport: Transport.TCP, options: { port: 5001 } })
  private readonly discordGateway: ClientProxy;

  async onApplicationBootstrap() {
    try {
      await this.discordGateway.connect();
    } catch (e) {}
    this.ebus
      .pipe(
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
        tap(t => this.discordGateway.emit(t.constructor.name, t)),
      )
      .subscribe();
  }
}
