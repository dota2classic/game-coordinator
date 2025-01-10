import { EventsHandler, IEventHandler } from "@nestjs/cqrs";
import { MetricsService } from "../metrics.service";
import { PartyLeftQueueEvent } from "../../mm/queue/event/party-left-queue.event";

@EventsHandler(PartyLeftQueueEvent)
export class MetricsQueueEndLeftHandler
  implements IEventHandler<PartyLeftQueueEvent>
{
  constructor(private readonly metrics: MetricsService) {}

  async handle(event: PartyLeftQueueEvent) {
    event.players.forEach((plr) => this.metrics.leaveQueue(plr, "left"));
  }
}
