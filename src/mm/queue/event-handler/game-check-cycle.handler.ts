import { EventBus, EventsHandler, IEventHandler } from "@nestjs/cqrs";
import { GameCheckCycleEvent } from "mm/queue/event/game-check-cycle.event";
import { QueueRepository } from "mm/queue/repository/queue.repository";
import { QueueService } from "mm/queue/service/queue.service";
import { GameFoundEvent } from "mm/queue/event/game-found.event";
import { MatchmakingMode } from "gateway/gateway/shared-types/matchmaking-mode";
import { BalanceService } from "mm/queue/service/balance.service";
import { QueueModel } from "mm/queue/model/queue.model";
import { Logger } from "@nestjs/common";

@EventsHandler(GameCheckCycleEvent)
export class GameCheckCycleHandler
  implements IEventHandler<GameCheckCycleEvent>
{
  private logger = new Logger(GameCheckCycleHandler.name);
  private processMap: Partial<{
    [key in MatchmakingMode]: boolean;
  }> = {};

  constructor(
    private readonly rep: QueueRepository,
    private readonly qService: QueueService,
    private readonly ebus: EventBus,
    private readonly balanceService: BalanceService,
  ) {}

  async handle(event: GameCheckCycleEvent) {
    // ok here we

    const q = await this.rep.get(QueueRepository.id(event.mode, event.version));
    if (!q) return;

    if (event.mode === MatchmakingMode.RANKED) {
      await this.checkRanked(event, q);

      return;
    }

    if (event.mode === MatchmakingMode.UNRANKED) {
      await this.checkRanked(event, q);

      return;
    }

    if (event.mode === MatchmakingMode.HIGHROOM) {
      await this.checkRanked(event, q);

      return;
    }

    if (event.mode !== MatchmakingMode.BOTS) return;
    // should work right
    await this.findBotGame(event, q);
  }

  private async findBotGame(event: GameCheckCycleEvent, q: QueueModel) {
    for (let i = 0; i < 100; i++) {
      const game = this.qService.findGame(q);
      if (!game) {
        break;
      }
      try {
        const balance = BalanceService.genericBalance(game.mode, game.entries);
        q.removeAll(game.entries);
        q.commit();

        this.ebus.publish(
          new GameFoundEvent(balance, event.version, game.mode),
        );
      } catch (e) {
        // console.log("Bot stuff")
        this.logger.warn("Error in findBotGame:");
        this.logger.warn(e);
      }
    }
  }

  private async checkRanked(event: GameCheckCycleEvent, q: QueueModel) {
    // async yeah
    if (this.processMap[event.mode]) {
      this.logger.warn(
        `Skipping check for mode ${q.mode}: Already in progress`,
      );
      return;
    }

    this.processMap[event.mode] = true;

    q.entries.forEach((entry) => {
      entry.waitingScore++;
    });

    this.processMap[event.mode] = false;
  }
}
