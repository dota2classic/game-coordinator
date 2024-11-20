import { Injectable, Logger } from "@nestjs/common";
import { QueueModel } from "mm/queue/model/queue.model";
import {
  MatchmakingMode,
  RoomSizes,
} from "gateway/gateway/shared-types/matchmaking-mode";
import { QueueGameEntity } from "mm/queue/model/entity/queue-game.entity";
import { QueueEntryModel } from "mm/queue/model/queue-entry.model";
import { BalanceService } from "mm/queue/service/balance.service";
import { Cron } from "@nestjs/schedule";
import { EventBus } from "@nestjs/cqrs";
import { GameCheckCycleEvent } from "mm/queue/event/game-check-cycle.event";
import { Dota2Version } from "gateway/gateway/shared-types/dota2version";
import { findAllMatchingCombinations } from "../../../util/combinations";

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
    this.ebus.publish(
      new GameCheckCycleEvent(MatchmakingMode.UNRANKED, Dota2Version.Dota_681),
    );
    this.ebus.publish(
      new GameCheckCycleEvent(MatchmakingMode.UNRANKED, Dota2Version.Dota_684),
    );

    this.ebus.publish(
      new GameCheckCycleEvent(MatchmakingMode.RANKED, Dota2Version.Dota_681),
    );
    this.ebus.publish(
      new GameCheckCycleEvent(MatchmakingMode.RANKED, Dota2Version.Dota_684),
    );

    this.ebus.publish(
      new GameCheckCycleEvent(MatchmakingMode.HIGHROOM, Dota2Version.Dota_681),
    );
    this.ebus.publish(
      new GameCheckCycleEvent(MatchmakingMode.HIGHROOM, Dota2Version.Dota_684),
    );
  }

  public findGame(q: QueueModel): QueueGameEntity | undefined {
    if (q.mode === MatchmakingMode.RANKED) {
      return this.findRankedGame(q);
    }

    if (q.mode === MatchmakingMode.SOLOMID) {
      return this.findSoloMidGame(q);
    }

    if (q.mode === MatchmakingMode.BOTS) {
      return this.findBotsGame(q);
    }

    return this.findUnrankedGame(q);
  }

  private findRankedGame(q: QueueModel): QueueGameEntity | undefined {
    if (q.size < RoomSizes[q.mode]) return undefined;

    // return this.rankedGameBalance(q);
  }

  private findUnrankedGame(q: QueueModel): QueueGameEntity | undefined {
    if (q.size < RoomSizes[q.mode]) return undefined;

    // return this.balancedGame(q);
  }

  private findSoloMidGame(q: QueueModel): QueueGameEntity | undefined {
    if (q.size < RoomSizes[q.mode]) return undefined;

    return QueueService.balancedGameSearch(q);
  }

  /**
   * TODO: we need to make this work better.
   * @param q
   * @private
   */
  private static balancedGameSearch(q: QueueModel) {
    const sortedBySize = [...q.entries];
    sortedBySize.sort((a, b) => b.size - a.size);

    const desiredSize = RoomSizes[q.mode];

    const slice: QueueEntryModel[] = [];
    let size = 0;
    for (let i = 0; i < sortedBySize.length; i++) {
      const t = sortedBySize[i];
      if (size + t.size > desiredSize) {
        // skip
        continue;
      }

      size += t.size;
      slice.push(t);
    }
    if (size !== desiredSize) return undefined;

    return new QueueGameEntity(q.mode, slice);
  }

  /**
   * Group all players in queue and find them a goddamn game
   * @param q
   * @private
   */
  private findBotsGame(q: QueueModel): QueueGameEntity | undefined {
    if (q.size === 0) return undefined;

    // ok, how do we balance bot games?
    const sorted = [...q.entries].sort((a, b) => b.size - a.size);

    const slice: QueueEntryModel[] = [];
    let pc = 0;
    for (let i = 0; i < sorted.length; i++) {
      if (pc + sorted[i].size > 10) continue;

      slice.push(sorted[i]);
      pc += sorted[i].size;
    }

    return new QueueGameEntity(q.mode, slice);
  }

  private findBotsGame2(q: QueueModel): QueueGameEntity | undefined {
    if (q.size < 2) return undefined;

    // ok, how do we balance bot games?
    const sorted = [...q.entries].sort((a, b) => b.size - a.size);

    const slice: QueueEntryModel[] = [];
    let pc = 0;
    for (let i = 0; i < sorted.length; i++) {
      slice.push(sorted[i]);
      pc += sorted[i].size;

      if (pc >= 10) break;
    }

    return new QueueGameEntity(q.mode, slice);
  }

  public balancedGame(
    q: QueueModel,
    roomSize: number = 10,
    strict: boolean = false,
  ) {
    const teamSize = Math.round(roomSize / 2);

    // DESC sorting by deviation score results in prioritizing long waiting players
    const arr = [...q.entries].sort((a, b) => b.waitingScore - a.waitingScore);
    const games = findAllMatchingCombinations(
      roomSize,
      arr,
      (entries) => {
        try {
          BalanceService.rankedBalance(teamSize, entries, strict);
          return true;
        } catch (e) {
          return false;
        }
      },
      (t) => t.size,
    );
    this.logger.log(`Total possible games: ${games}`);

    for (let i = 0; i < games.length; i++) {
      const game = games[i];

      this.logger.log(`Queue: iteration #${i}`);

      try {
        const balance = BalanceService.rankedBalance(teamSize, game, strict);

        this.logger.log("So here is the balance for us");
        this.logger.log(JSON.stringify(balance));

        q.removeAll(game);
        q.commit();

        return balance;
      } catch (e) {
        this.logger.warn("How can it fail right away");
      }
    }
  }
}
