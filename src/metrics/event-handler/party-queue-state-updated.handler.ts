import { EventsHandler, IEventHandler } from "@nestjs/cqrs";
import { MetricsService } from "../metrics.service";
import { PartyQueueStateUpdatedEvent } from "../../gateway/gateway/events/mm/party-queue-state-updated.event";

@EventsHandler(PartyQueueStateUpdatedEvent)
export class PartyQueueStateUpdatedHandler
  implements IEventHandler<PartyQueueStateUpdatedEvent>
{
  constructor(private readonly metricService: MetricsService) {}

  async handle(event: PartyQueueStateUpdatedEvent) {
    if (event.queueState) {
      event.entries.forEach((plr) =>
        this.metricService.enterQueue(
          plr,
          event.queueState.mode,
          event.entries.length,
        ),
      );
    }
  }
}
