import { Injectable, Logger } from "@nestjs/common";
import { QueueModel } from "mm/queue/model/queue.model";
import { MatchmakingMode } from "gateway/gateway/shared-types/matchmaking-mode";
import { QueueEntryModel } from "mm/queue/model/queue-entry.model";
import { Cron } from "@nestjs/schedule";
import { EventBus } from "@nestjs/cqrs";
import { GameCheckCycleEvent } from "mm/queue/event/game-check-cycle.event";
import { Dota2Version } from "gateway/gateway/shared-types/dota2version";
import { findBestMatchBy } from "../../../util/permutations";
import { RoomBalance, TeamEntry } from "../../room/model/entity/room-balance";

@Injectable()
export class QueueService {
  constructor(
    private readonly ebus: EventBus,
  ) {}

  public static waitingScoreFirstOptimizeFunction = (
    left: QueueEntryModel[],
    right: QueueEntryModel[],
  ) => {
    const lavg = left.reduce((a, b) => a + b.score, 0) / 5;
    const ravg = right.reduce((a, b) => a + b.score, 0) / 5;
    const avgDiff = Math.abs(lavg - ravg);

    let waitingScore = 0;
    for (let i = 0; i < left.length; i++) {
      waitingScore += left[i].waitingScore;
    }
    for (let i = 0; i < right.length; i++) {
      waitingScore += right[i].waitingScore;
    }

    // We want waitingScore to be highest, so we invert it
    waitingScore = Math.log(Math.max(1, waitingScore));
    waitingScore = -waitingScore;

    const comp1 = waitingScore * 100000;
    // const comp1 = waitingScore * 100 / Math.abs(Math.max(10, avgDiff));

    return comp1 + avgDiff;
  };

  public static balanceOptimizeFunction2 = (
    left: QueueEntryModel[],
    right: QueueEntryModel[],
  ) => {
    const lavg = left.reduce((a, b) => a + b.score, 0) / 5;
    const ravg = right.reduce((a, b) => a + b.score, 0) / 5;
    return Math.abs(lavg - ravg);
  };

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
    this.ebus.publish(
      new GameCheckCycleEvent(MatchmakingMode.UNRANKED, Dota2Version.Dota_684),
    );
    this.ebus.publish(
      new GameCheckCycleEvent(MatchmakingMode.BOTS_2X2, Dota2Version.Dota_684),
    );
  }

  @Cron("*/10 * * * * *")
  async checkSolomidGame() {
    this.ebus.publish(
      new GameCheckCycleEvent(MatchmakingMode.SOLOMID, Dota2Version.Dota_684),
    );
  }

  /**
   * 1 game per party
   * @param q
   * @param teamSize
   * @private
   */
  public findBotsGame(q: QueueModel): RoomBalance | undefined {
    if (q.size === 0) return undefined;

    const entry = q.entries[0];

    return new RoomBalance([new TeamEntry([entry]), new TeamEntry([])]);
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
    if (totalPlayersInQ < teamSize * 2) {
      this.logger.verbose(
        `Less players in queue than required for game, skipping`,
        {
          mode: q.mode,
          version: q.version,
          queue_size: totalPlayersInQ,
          team_size: teamSize,
        },
      );
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
      QueueService.waitingScoreFirstOptimizeFunction,
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
      diff: QueueService.waitingScoreFirstOptimizeFunction(left, right),
      left: left.reduce((a, b) => a + b.score, 0) / 5,
      right: right.reduce((a, b) => a + b.score, 0) / 5,
    });

    return new RoomBalance([new TeamEntry(left), new TeamEntry(right)]);
  }

  /**
   * Party of 2 players are automatically placed against each other
   * @param q
   */
  public findSolomidGame(q: QueueModel): RoomBalance | undefined {
    if (q.entries.flatMap((it) => it.players).length < 2) return;
    // If we have a pair party, match them
    const pair = q.entries.find((it) => it.size === 2);
    if (pair) {
      this.logger.log("Making 1x1 game of 2 sized party");
      return new RoomBalance([
        new TeamEntry([
          new QueueEntryModel(pair.partyID, pair.mode, pair.version, [
            pair.players[0],
          ]),
        ]),
        new TeamEntry([
          new QueueEntryModel(pair.partyID, pair.mode, pair.version, [
            pair.players[1],
          ]),
        ]),
      ]);
    }
    const pool = [...q.entries];

    const bestMatch = findBestMatchBy(
      pool,
      1,
      QueueService.waitingScoreFirstOptimizeFunction,
      2000, // Max 5 seconds to find a game
    );

    if (bestMatch === undefined) {
      this.logger.warn("Can't find game: should not be possible");
      return undefined;
    }

    return new RoomBalance([
      new TeamEntry(bestMatch[0]),
      new TeamEntry(bestMatch[1]),
    ]);
  }
}
