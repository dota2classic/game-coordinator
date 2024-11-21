import { Injectable, Logger } from "@nestjs/common";
import { QueueModel } from "mm/queue/model/queue.model";
import { MatchmakingMode } from "gateway/gateway/shared-types/matchmaking-mode";
import { QueueEntryModel } from "mm/queue/model/queue-entry.model";
import { BalanceService } from "mm/queue/service/balance.service";
import { Cron } from "@nestjs/schedule";
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
      new GameCheckCycleEvent(MatchmakingMode.BOTS, Dota2Version.Dota_681),
    );
    this.ebus.publish(
      new GameCheckCycleEvent(MatchmakingMode.BOTS, Dota2Version.Dota_684),
    );
  }

  // each minute
  // @Cron(CronExpression.EVERY_MINUTE)
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
    const totalPlayersInQ = pool.reduce((a, b) => a + b.size, 0);
    if (totalPlayersInQ < 10) {
      this.logger.warn("Less than 10 players in queue, skip matchmaking")
      return;
    }

    // TODO: consider player left queue while searching is going on

    this.logger.log(`Starting matchmaker for 5000 ms...`);
    const bestMatch = findBestMatchBy(
      pool,
      teamSize,
      scoreAvgDifference,
      5_000, // Max 5 seconds to find a game
    );
    if (bestMatch === undefined) {
      this.logger.warn(
        `Couldn't find a balanced game with ${totalPlayersInQ} players in queue.`,
      );
      this.logger.warn(JSON.stringify(pool));
      return;
    }

    const [left, right] = bestMatch;

    this.logger.log(
      `Best match has difference of ${scoreAvgDifference(left, right)}`,
    );

    return new RoomBalance([new TeamEntry(left), new TeamEntry(right)]);
  }
}
