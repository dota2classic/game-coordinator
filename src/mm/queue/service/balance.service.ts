import { Injectable } from "@nestjs/common";
import { RoomBalance, TeamEntry } from "mm/room/model/entity/room-balance";
import { BalanceException } from "mm/queue/exception/BalanceException";
import { PlayerInQueueEntity } from "mm/queue/model/entity/player-in-queue.entity";
import { QueueEntryModel } from "mm/queue/model/queue-entry.model";
import {
  MatchmakingMode,
  RoomSizes,
} from "gateway/gateway/shared-types/matchmaking-mode";

@Injectable()
export class BalanceService {
  private static readonly RECENT_WINRATE_CAP: number = 20;
  private static readonly WINRATE_FACTOR: number = 1500;
  private static readonly MAX_AVERAGE_SCORE_FOR_GAME: number = 1500;
  private static readonly MAX_SCORE_DIFFERENCE: number = 500;
  private static readonly MAX_RATING_DIFFERENCE: number = 1000;
  private static readonly DEVIATION_MAX_FACTOR = 500;
  private static readonly DEVIATION_MAX_SCORE = 10;

  private static getPartyFactor(count: number): number {
    // keep score same for single players and higher for parties
    // return 1 + 0.1 * (count - 1);
    // ok lets not increase it for parties.
    return 1;
  }

  public static getScore(
    mmr: number,
    wrLast20Games: number,
    kdaLast20Games: number,
    gamesPlayed: number,
  ): number {
    const minGames = Math.min(gamesPlayed, 20);
    return wrLast20Games * kdaLast20Games * minGames;

    // const desiredWinrate = 0.5;
    //
    // // if played < 20 games, winrate will be less effective
    // const newbieWinrateFactor =
    //   Math.min(gamesPlayed, this.RECENT_WINRATE_CAP) / this.RECENT_WINRATE_CAP;

    // return (
    //   newbieWinrateFactor *
    //     this.WINRATE_FACTOR *
    //     (wrLast20Games - desiredWinrate)
    // );
  }

  public static getTotalScore(players: PlayerInQueueEntity[]): number {
    const scoreSum = players.reduce(
      (a, b) =>
        a +
        BalanceService.getScore(
          b.mmr,
          b.recentWinrate,
          b.recentKDA,
          b.gamesPlayed,
        ),
      0,
    );

    return scoreSum * BalanceService.getPartyFactor(players.length);
  }

  private static calculateScoreDeviation(dScore: number) {
    return (
      (Math.min(BalanceService.DEVIATION_MAX_SCORE, dScore) /
        BalanceService.DEVIATION_MAX_SCORE) *
      BalanceService.DEVIATION_MAX_FACTOR
    );
  }

  public static rankedBalance(
    teamSize: number,
    parties: QueueEntryModel[],
    mmrDiffStrict: boolean = true,
  ): RoomBalance {
    let radiantScore = 0;
    let direScore = 0;

    const radiantParties: QueueEntryModel[] = [];
    const direParties: QueueEntryModel[] = [];

    let radiantPlayerCount = 0;
    let direPlayerCount = 0;

    const preparedParties = parties.sort(
      (a, b) => b.averageScore - a.averageScore,
    );

    // const lowestParty = preparedParties[preparedParties.length - 1];
    // const highestParty = preparedParties[0];

    // const lowestPartyScore =
    //   lowestParty.averageScore +
    //   BalanceService.calculateScoreDeviation(lowestParty.DeviationScore);
    //
    // const highestPartyScore =
    //   highestParty.averageScore -
    //   BalanceService.calculateScoreDeviation(highestParty.DeviationScore);
    //
    // const playersSorted = preparedParties
    //   .flatMap(t => t.players)
    //   .sort((a, b) => b.mmr - a.mmr);

    // const highestMmr = playersSorted[0].mmr;
    // const lowestMmr = playersSorted[playersSorted.length - 1].mmr;

    // if (
    //   mmrDiffStrict &&
    //   Math.abs(highestPartyScore - lowestPartyScore) >
    //     BalanceService.MAX_SCORE_DIFFERENCE
    // ) {
    //   throw new BalanceException(
    //     `Parties mmr too scattered ${lowestPartyScore} - ${highestPartyScore}`,
    //   );
    // }

    // todo: when mmr scatters more and online increase, uncomment
    // if(Math.abs(highestMmr - lowestMmr) > BalanceService.MAX_RATING_DIFFERENCE){
    //   throw new BalanceException(
    //     `Single player mmr too scattered ${highestMmr} - ${lowestMmr}`,
    //   );
    // }

    preparedParties.forEach(it => {
      if (
        // if radiant less mmr and
        (radiantScore <= direScore && radiantPlayerCount < teamSize) ||
        direPlayerCount === teamSize
      ) {
        radiantParties.push(it);
        radiantPlayerCount += it.players.length;
        radiantScore += it.score;
      } else if (
        (direScore <= radiantScore && direPlayerCount < teamSize) ||
        radiantPlayerCount === teamSize
      ) {
        direParties.push(it);
        direPlayerCount += it.players.length;
        direScore += it.score;
      } else if (radiantPlayerCount < teamSize) {
        radiantParties.push(it);
        radiantPlayerCount += it.players.length;
        radiantScore += it.score;
      } else if (direPlayerCount < teamSize) {
        direParties.push(it);
        direPlayerCount += it.players.length;
        direScore += it.score;
      }
    });

    if (radiantPlayerCount !== teamSize || direPlayerCount !== teamSize) {
      throw new BalanceException(
        `Final size dont fit ${radiantPlayerCount} ${direPlayerCount}`,
      );
    }

    const rAvrg = radiantScore / teamSize;
    const dAvrg = direScore / teamSize;

    const hrs = new Date().getHours();
    const isNight = hrs > 22 || hrs < 9;

    if (
      mmrDiffStrict &&
      Math.abs(rAvrg - dAvrg) >=
        (isNight
          ? 2 * BalanceService.MAX_AVERAGE_SCORE_FOR_GAME
          : BalanceService.MAX_AVERAGE_SCORE_FOR_GAME)
    ) {
      throw new BalanceException(
        `Radiant ${rAvrg} Dire ${dAvrg}. Diff: ${Math.abs(
          rAvrg - dAvrg,
        )}, limit: ${BalanceService.MAX_AVERAGE_SCORE_FOR_GAME}`,
      );
    }

    return new RoomBalance(
      [radiantParties, direParties].map(
        list =>
          new TeamEntry(
            list,
            list.reduce((a, b) => a + b.score, 0),
          ),
      ),
      MatchmakingMode.RANKED,
    );
  }

  public soloMidBalance(teamSize: number, parties: QueueEntryModel[]) {
    if (parties.length !== 2) throw new BalanceException();

    return new RoomBalance(
      [[parties[0]], [parties[1]]].map(list => new TeamEntry(list, 0)),
      MatchmakingMode.SOLOMID,
    );
  }

  botsBalance(
    teamSize: number,
    parties: QueueEntryModel[],
    roomBalanceMode: MatchmakingMode = MatchmakingMode.BOTS,
  ): RoomBalance {
    const r: QueueEntryModel[] = [];
    const d: QueueEntryModel[] = [];

    let rSize = 0,
      dSize = 0;

    const sorted = [...parties].sort(
      (a, b) => b.players.length - a.players.length,
    );

    for (let i = 0; i < sorted.length; i++) {
      const e = sorted[i];
      if (rSize < dSize && rSize + e.players.length <= teamSize) {
        r.push(e);
        rSize += e.players.length;
      } else {
        d.push(e);
        dSize += e.players.length;
      }
    }

    if (rSize > teamSize || dSize > teamSize)
      throw new BalanceException("Can't even balance bot game hah");

    return new RoomBalance(
      [new TeamEntry(r, 0), new TeamEntry(d, 0)],
      roomBalanceMode,
    );
  }

  genericBalance(
    mode: MatchmakingMode,
    entries: QueueEntryModel[],
  ): RoomBalance {
    const teamSize = Math.round(RoomSizes[mode] / 2);
    switch (mode) {
      case MatchmakingMode.UNRANKED:
        const balance = BalanceService.rankedBalance(teamSize, entries, false);
        balance.mode = mode;
        return balance;
      case MatchmakingMode.BOTS:
        return this.botsBalance(teamSize, entries);
      case MatchmakingMode.SOLOMID:
        return this.soloMidBalance(teamSize, entries);
      default:
        return this.botsBalance(teamSize, entries, mode);
    }
  }
}
