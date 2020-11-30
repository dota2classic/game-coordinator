import {Injectable} from "@nestjs/common";
import {QueueModel} from "src/mm/queue/model/queue.model";
import {MatchmakingMode, RoomSizes,} from "src/gateway/gateway/shared-types/matchmaking-mode";
import {QueueGameEntity} from "src/mm/queue/model/entity/queue-game.entity";
import {QueueEntryModel} from "src/mm/queue/model/queue-entry.model";
import {BalanceService} from "src/mm/queue/service/balance.service";

@Injectable()
export class QueueService {
  constructor(private readonly balanceService: BalanceService) {}
  public findGame(q: QueueModel): QueueGameEntity | undefined {
    if (q.mode === MatchmakingMode.RANKED) {
      return this.findRankedGame(q);
    }

    if (q.mode === MatchmakingMode.SOLOMID) {
      return this.findSoloMidGame(q);
    }

    return this.findUnrankedGame(q);
  }

  private findRankedGame(q: QueueModel): QueueGameEntity | undefined {
    if (q.size < RoomSizes[q.mode]) return undefined;

    return this.rankedGameBalance(q);
  }

  private findUnrankedGame(q: QueueModel): QueueGameEntity | undefined {
    if (q.size < RoomSizes[q.mode]) return undefined;

    return QueueService.balancedGameSearch(q);
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

  private rankedGameBalance(q: QueueModel) {
    const sortedBySize = [...q.entries];
    sortedBySize.sort((a, b) => b.size - a.size);

    const queueUnits = sortedBySize.map(t =>
      this.balanceService.getPartyScore({
        players: t.players.map(p => ({
          mmr: p.mmr,
          wrLast20Games: p.recentWinrate,
          gamesPlayed: p.gamesPlayed,
        })),
        partyId: t.partyID,
      }),
    );

    const desiredSize = RoomSizes[q.mode];

    const slice: QueueEntryModel[] = [];
    let size = 0;
    for (let i = 0; i < queueUnits.length; i++) {
      const t = queueUnits[i];
      if (size + t.players > desiredSize) {
        // skip
        continue;
      }

      size += t.players;
      slice.push(sortedBySize.find(z => z.partyID === t.partyId));
    }
    if (size !== desiredSize) return undefined;

    return new QueueGameEntity(q.mode, slice);
  }
}
