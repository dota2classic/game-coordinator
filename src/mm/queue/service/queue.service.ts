import { Injectable, Logger } from "@nestjs/common";
import { QueueModel } from "mm/queue/model/queue.model";
import { MatchmakingMode } from "gateway/gateway/shared-types/matchmaking-mode";
import { QueueEntryModel } from "mm/queue/model/queue-entry.model";
import { BalanceService } from "mm/queue/service/balance.service";
import { Cron, CronExpression } from "@nestjs/schedule";
import { EventBus } from "@nestjs/cqrs";
import { GameCheckCycleEvent } from "mm/queue/event/game-check-cycle.event";
import { Dota2Version } from "gateway/gateway/shared-types/dota2version";
import { findBestMatchBy } from "../../../util/permutations";
import { RoomBalance, TeamEntry } from "../../room/model/entity/room-balance";

const scoreAvgDifference = (
  left: QueueEntryModel[],
  right: QueueEntryModel[],
) => {
  const lavg = left.reduce((a, b) => a + b.score, 0) / 5;
  const ravg = right.reduce((a, b) => a + b.score, 0) / 5;
  return Math.abs(lavg - ravg);
};

@Injectable()
export class QueueService {
  constructor(
    private readonly balanceService: BalanceService,
    private readonly ebus: EventBus,
  ) {}

  private logger = new Logger(QueueService.name);

  // Every 10 seconds try find bots game
  @Cron("*/10 * * * * *")
  async checkBotGame() {
    this.ebus.publish(
      new GameCheckCycleEvent(MatchmakingMode.BOTS, Dota2Version.Dota_684),
    );
  }

  // each minute
  @Cron("*/20 * * * * *")
  async checkRankedGame() {
    // this.ebus.publish(
    //   new GameCheckCycleEvent(MatchmakingMode.UNRANKED, Dota2Version.Dota_681),
    // );
    this.ebus.publish(
      new GameCheckCycleEvent(MatchmakingMode.UNRANKED, Dota2Version.Dota_684),
    );
    //
    // this.ebus.publish(
    //   new GameCheckCycleEvent(MatchmakingMode.RANKED, Dota2Version.Dota_681),
    // );
    // this.ebus.publish(
    //   new GameCheckCycleEvent(MatchmakingMode.RANKED, Dota2Version.Dota_684),
    // );

    // this.ebus.publish(
    //   new GameCheckCycleEvent(MatchmakingMode.HIGHROOM, Dota2Version.Dota_681),
    // );
    // this.ebus.publish(
    //   new GameCheckCycleEvent(MatchmakingMode.HIGHROOM, Dota2Version.Dota_684),
    // );
  }

  /**
   * Group all players in queue and find them a goddamn game
   * @param q
   * @param teamSize
   * @private
   */
  public findBotsGame(
    q: QueueModel,
    teamSize: number = 5,
  ): RoomBalance | undefined {
    if (q.size === 0) return undefined;

    const radiantParties: QueueEntryModel[] = [];
    const direParties: QueueEntryModel[] = [];

    let radiantPlayerCount = 0;
    let direPlayerCount = 0;

    const preparedParties = [...q.entries];

    for (let party of preparedParties) {
      const pc = party.size;
      const canGoLeft = teamSize - radiantPlayerCount > pc;
      const canGoRight = teamSize - direPlayerCount > pc;

      if (canGoLeft && (radiantPlayerCount <= direPlayerCount || !canGoRight)) {
        radiantParties.push(party);
        radiantPlayerCount += pc;
      } else if (
        canGoRight &&
        (direPlayerCount <= radiantPlayerCount || !canGoLeft)
      ) {
        direParties.push(party);
        direPlayerCount += pc;
      } else {
        // We can't fit them anymore!
        continue;
      }
    }

    if (radiantPlayerCount === 0 && direPlayerCount === 0) return undefined;

    return new RoomBalance([
      new TeamEntry(radiantParties),
      new TeamEntry(direParties),
    ]);
  }

  /**
   * Finds a game with teamSize x teamSize teams while minimizing absolute difference in scores. Limited by 5 seconds
   * @param q
   * @param teamSize
   */
  public findBalancedGame(q: QueueModel, teamSize: number = 5) {
    const pool = [...q.entries];

    // Let's first filter off this case
    const totalPlayersInQ = q.size;
    if (totalPlayersInQ < 10) {
      this.logger.verbose("Less than 10 players in queue, skipping", {
        mode: q.mode,
        version: q.version,
        queue_size: totalPlayersInQ,
      });
      return;
    }

    // TODO: consider player left queue while searching is going on

    const timeLimit = 5000;

    this.logger.log(`Starting matchmaking on queue`, {
      mode: q.mode,
      version: q.version,
      timeLimit,
    });
    const bestMatch = findBestMatchBy(
      pool,
      teamSize,
      scoreAvgDifference,
      timeLimit, // Max 5 seconds to find a game
    );
    if (bestMatch === undefined) {
      this.logger.error(`Couldn't find a balanced game`, {
        pool,
        queue_size: totalPlayersInQ,
        mode: q.mode,
        version: q.version,
      });
      return undefined;
    }

    const [left, right] = bestMatch;

    this.logger.log(`Found balanced game`, {
      diff: scoreAvgDifference(left, right),
      left: left.reduce((a, b) => a + b.score, 0) / 5,
      right: right.reduce((a, b) => a + b.score, 0) / 5,
    });

    return new RoomBalance([new TeamEntry(left), new TeamEntry(right)]);
  }
}
