import {EventBus, EventsHandler, IEventHandler} from "@nestjs/cqrs";
import {GameCheckCycleEvent} from "src/mm/queue/event/game-check-cycle.event";
import {QueueRepository} from "src/mm/queue/repository/queue.repository";
import {QueueService} from "src/mm/queue/service/queue.service";
import {GameFoundEvent} from "src/mm/queue/event/game-found.event";
import {MatchmakingMode, RoomSizes,} from "src/gateway/gateway/shared-types/matchmaking-mode";
import {findAllMatchingCombinations} from "src/util/combinations";
import {BalanceService} from "src/mm/queue/service/balance.service";
import {QueueModel} from "src/mm/queue/model/queue.model";
import {LogEvent} from "src/gateway/gateway/events/log.event";

@EventsHandler(GameCheckCycleEvent)
export class GameCheckCycleHandler
  implements IEventHandler<GameCheckCycleEvent> {
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
        const balance = this.balanceService.genericBalance(
          game.mode,
          game.entries,
        );
        q.removeAll(game.entries);
        q.commit();

        this.ebus.publish(new GameFoundEvent(balance, event.version));
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
      (a, b) => b.DeviationScore - a.DeviationScore,
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

    for (let i = 0; i < games.length; i++) {
      const game = games[i];

      try {
        const balance = BalanceService.rankedBalance(
          teamSize,
          game,
          event.mode === MatchmakingMode.RANKED,
        );
        balance.mode = event.mode;

        q.removeAll(game);
        q.commit();

        this.ebus.publish(new GameFoundEvent(balance, event.version));

        await new Promise(r => setTimeout(r, 1000));
      } catch (e) {
        console.log("How can it fail right away");
      }
    }

    // we increase this thing
    q.entries.forEach(entry => {
      entry.DeviationScore++;
    });

    this.processMap[event.mode] = false;
  }
}
