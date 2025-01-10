import { EventsHandler, IEventHandler } from "@nestjs/cqrs";
import { MetricsService } from "../metrics.service";
import { GameFoundEvent } from "../../mm/queue/event/game-found.event";

@EventsHandler(GameFoundEvent)
export class MetricsQueueEndGameFoundHandler
  implements IEventHandler<GameFoundEvent>
{
  constructor(private readonly metrics: MetricsService) {}

  async handle(event: GameFoundEvent) {
    const players = event.balance.teams
      .flatMap((t) => t.parties)
      .flatMap((t) => t.players);
    players.forEach((plr) => this.metrics.leaveQueue(plr.playerId, "found"));
  }
}
