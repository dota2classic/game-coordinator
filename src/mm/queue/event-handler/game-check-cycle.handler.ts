import { EventBus, EventsHandler, IEventHandler } from "@nestjs/cqrs";
import { GameCheckCycleEvent } from "mm/queue/event/game-check-cycle.event";
import { QueueRepository } from "mm/queue/repository/queue.repository";
import { QueueService } from "mm/queue/service/queue.service";
import { GameFoundEvent } from "mm/queue/event/game-found.event";
import {
  MatchmakingMode,
  RoomSizes,
} from "gateway/gateway/shared-types/matchmaking-mode";
import { findAllMatchingCombinations } from "util/combinations";
import { BalanceService } from "mm/queue/service/balance.service";
import { QueueModel } from "mm/queue/model/queue.model";
import { Logger } from "@nestjs/common";

@EventsHandler(GameCheckCycleEvent)
export class GameCheckCycleHandler
  implements IEventHandler<GameCheckCycleEvent> {
  private logger = new Logger(GameCheckCycleHandler.name);
  private processMap: Partial<
    {
      [key in MatchmakingMode]: boolean;
    }
  > = {};

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
    while (true) {
      const game = this.qService.findGame(q);
      if (!game) {
        break;
      }
      try {
        const balance = BalanceService.genericBalance(
          game.mode,
          game.entries,
        );
        q.removeAll(game.entries);
        q.commit();

        this.ebus.publish(
          new GameFoundEvent(balance, event.version, game.mode),
        );
      } catch (e) {
        // console.log("Bot stuff")
      }
    }
  }

  private async checkRanked(event: GameCheckCycleEvent, q: QueueModel) {
    // async yeah
    if (this.processMap[event.mode]) return;

    this.processMap[event.mode] = true;

    const teamSize = Math.round(RoomSizes[event.mode] / 2);

    // DESC sorting by deviation score results in prioritizing long waiting players
    const arr = [...q.entries].sort(
      (a, b) => b.waitingScore - a.waitingScore,
    );
    const games = findAllMatchingCombinations(
      RoomSizes[event.mode],
      arr,
      entries => {
        try {
          BalanceService.rankedBalance(
            teamSize,
            entries,
            event.mode === MatchmakingMode.RANKED,
          );
          return true;
        } catch (e) {
          return false;
        }
      },
      t => t.size,
    );

    this.logger.log(`Total ${games.length} possible combinations`);

    for (let i = 0; i < games.length; i++) {
      const game = games[i];

      try {
        const balance = BalanceService.rankedBalance(
          teamSize,
          game,
          event.mode === MatchmakingMode.RANKED,
        );

        this.logger.log("So here is the balance for us");
        this.logger.log(JSON.stringify(balance));

        q.removeAll(game);
        q.commit();

        this.ebus.publish(
          new GameFoundEvent(balance, event.version, event.mode),
        );

        await new Promise(r => setTimeout(r, 1000));
        break;
      } catch (e) {
        this.logger.warn("How can it fail right away");
      }
    }

    // we increase this thing
    q.entries.forEach(entry => {
      entry.waitingScore++;
    });

    this.processMap[event.mode] = false;
  }
}
