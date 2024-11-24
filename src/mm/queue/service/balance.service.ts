import { Injectable } from "@nestjs/common";
import { RoomBalance, TeamEntry } from "mm/room/model/entity/room-balance";
import { BalanceException } from "mm/queue/exception/balance.exception";
import { PlayerInQueueEntity } from "mm/queue/model/entity/player-in-queue.entity";
import { QueueEntryModel } from "mm/queue/model/queue-entry.model";

@Injectable()
export class BalanceService {

  private static getPartyFactor(count: number): number {
    // keep score same for single players and higher for parties
    // return 1 + 0.1 * (count - 1);
    // ok lets not increase it for parties.
    return 1;
  }

  static EXPERIENCE_FACTOR = 2.0;
  static MMR_FACTOR = 1.0;
  static TARGET_WINRATE = 0.5;

  /**
   * This is better, but still not good
   *
   * @param mmr
   * @param wrLast20Games
   * @param kdaLast20Games
   * @param gamesPlayed
   */
  public static getScore(
    mmr: number,
    wrLast20Games: number,
    kdaLast20Games: number,
    gamesPlayed: number,
  ): number {
    // B2 * ((MIN(D2, 90) + 10) / 100)* (C2 + 0.5)

    const EDUCATION_THRESHOLD = 10;

    // Education factor: the less games you have, the less score you will end up with
    const educationFactor =
      (Math.min(gamesPlayed, EDUCATION_THRESHOLD - 1) + 1) /
      EDUCATION_THRESHOLD;

    // Experience factor: if you have a lot of games, its diminishing returns, so we use log
    const experienceFactor = Math.log10(
      Math.min(500, Math.max(10, gamesPlayed)),
    );

    const mmrScore = mmr * BalanceService.MMR_FACTOR;

    // To prevent correction if newbie won his first game, we pad 20 games with 50% winrate
    let realWinrate = wrLast20Games;
    const padCount = 10;
    if (gamesPlayed < padCount) {
      const wonPlayedGames = wrLast20Games * gamesPlayed;
      const wonPaddedGames = Math.round(
        (padCount - gamesPlayed) * BalanceService.TARGET_WINRATE,
      );

      realWinrate = (wonPlayedGames + wonPaddedGames) / padCount;
    }

    const winrateFactor = realWinrate + BalanceService.TARGET_WINRATE;

    return mmrScore * (winrateFactor + experienceFactor) * educationFactor;
  }

  public static getTotalScore(players: PlayerInQueueEntity[]): number {
    const scoreSum = players.reduce(
      (a, b) => a + b.balanceScore,
      // BalanceService.getScore(
      //   b.mmr,
      //   b.recentWinrate,
      //   b.recentKDA,
      //   b.gamesPlayed,
      // ),
      0,
    );

    return scoreSum * BalanceService.getPartyFactor(players.length);
  }

  public static soloMidBalance(teamSize: number, entries: QueueEntryModel[]) {
    const isPartySolomid =
      entries.length === 1 && entries[0].players.length === 2;

    if (isPartySolomid) {
      const entry = entries[0];
      return new RoomBalance([
        new TeamEntry([
          new QueueEntryModel(entry.partyID, entry.mode, entry.version, [
            entry.players[0],
          ]),
        ]),
        new TeamEntry([
          new QueueEntryModel(entry.partyID, entry.mode, entry.version, [
            entry.players[1],
          ]),
        ]),
      ]);
    }

    if (entries.length !== 2) throw new BalanceException();
    return new RoomBalance(
      [[entries[0]], [entries[1]]].map((list) => new TeamEntry(list, 0)),
    );
  }
}
