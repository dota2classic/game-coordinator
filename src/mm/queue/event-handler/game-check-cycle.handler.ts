import {EventBus, EventsHandler, IEventHandler} from "@nestjs/cqrs";
import {GameCheckCycleEvent} from "src/mm/queue/event/game-check-cycle.event";
import {QueueRepository} from "src/mm/queue/repository/queue.repository";
import {QueueService} from "src/mm/queue/service/queue.service";
import {FoundGameParty, GameFoundEvent, PlayerInParty} from "src/mm/queue/event/game-found.event";

@EventsHandler(GameCheckCycleEvent)
export class GameCheckCycleHandler
  implements IEventHandler<GameCheckCycleEvent> {
  constructor(
    private readonly rep: QueueRepository,
    private readonly qService: QueueService,
    private readonly ebus: EventBus
  ) {}

  async handle(event: GameCheckCycleEvent) {
    // ok here we

    const q = await this.rep.get(event.mode);
    if (!q) return;

    const game = this.qService.findGame(q);
    if(!game) return;

    q.removeAll(game.entries);
    q.commit();

    this.ebus.publish(
      new GameFoundEvent(
        q.mode,
        game.entries.map(
          t =>
            new FoundGameParty(
              t.partyID,
              t.players
            ),
        ),
      ),
    )
  }
}
