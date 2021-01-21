import { EventBus, EventsHandler, IEventHandler } from "@nestjs/cqrs";
import { GameCheckCycleEvent } from "src/mm/queue/event/game-check-cycle.event";
import { QueueRepository } from "src/mm/queue/repository/queue.repository";
import { QueueService } from "src/mm/queue/service/queue.service";
import {
  FoundGameParty,
  GameFoundEvent,
} from "src/mm/queue/event/game-found.event";
import {
  MatchmakingMode,
  RoomSizes,
} from "src/gateway/gateway/shared-types/matchmaking-mode";
import { findAllMatchingCombinations } from "src/util/combinations";
import { BalanceService } from "src/mm/queue/service/balance.service";
import { QueueModel } from "src/mm/queue/model/queue.model";

@EventsHandler(GameCheckCycleEvent)
export class GameCheckCycleHandler
  implements IEventHandler<GameCheckCycleEvent> {
  isProcessingRanked = false;
  constructor(
    private readonly rep: QueueRepository,
    private readonly qService: QueueService,
    private readonly ebus: EventBus,
  ) {}

  async handle(event: GameCheckCycleEvent) {
    // ok here we

    const q = await this.rep.get(event.mode);
    if (!q) return;

    if (event.mode === MatchmakingMode.RANKED) {
      await this.checkRanked(event, q);

      return;
    }

    // should work right
    while (true) {
      const game = this.qService.findGame(q);
      if (!game) {
        break;
      }

      console.log(JSON.stringify(game));

      q.removeAll(game.entries);
      q.commit();

      this.ebus.publish(new GameFoundEvent(q.mode, game.entries));
    }
  }

  private async checkRanked(event: GameCheckCycleEvent, q: QueueModel) {

    // async yeah
    if(this.isProcessingRanked) return;

    this.isProcessingRanked = true;
    const teamSize = Math.round(RoomSizes[event.mode] / 2);

    const arr = [...q.entries];
    const games = findAllMatchingCombinations(
      RoomSizes[event.mode],
      arr,
      entries => {
        try {
          BalanceService.rankedBalance(teamSize, entries);
          return true;
        } catch (e) {
          return false;
        }
      },
      t => t.size,
    );

    games.forEach(game =>
      this.ebus.publish(new GameFoundEvent(event.mode, game)),
    );

    this.isProcessingRanked = false;
  }
}
