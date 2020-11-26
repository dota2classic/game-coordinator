import {Injectable} from "@nestjs/common";
import {PartyInRoom} from "src/mm/room/command/CreateRoom/create-room.command";
import {RoomBalance, TeamEntry} from "src/mm/room/model/entity/room-balance";
import {RuntimeException} from "@nestjs/core/errors/exceptions/runtime.exception";
import {BalanceException} from "src/mm/queue/exception/BalanceException";

export interface BalanceUnit {
  mmr: number;
  wrLast20Games: number;
  gamesPlayed: number;
}

export interface PartyBalanceUnit {
  players: BalanceUnit[];
  partyId: string;
}

export interface QueueUnit {
  players: number;
  partyId: string;
  totalScore: number;
}

@Injectable()
export class BalanceService {
  private readonly RECENT_WINRATE_CAP: number;
  private readonly WINRATE_FACTOR: number;

  constructor() {
    this.RECENT_WINRATE_CAP = 20;
    this.WINRATE_FACTOR = 2000;
  }

  private static getPartyFactor(count: number): number {
    // keep score same for single players and higher for parties
    return 1 + 0.1 * (count - 1);
  }

  public getScore(unit: BalanceUnit): number {
    const desiredWinrate = 0.5;

    // if played < 20 games, winrate will be less effective
    const newbieWinrateFactor =
      Math.min(unit.gamesPlayed, this.RECENT_WINRATE_CAP) /
      this.RECENT_WINRATE_CAP;

    return (
      unit.mmr +
      newbieWinrateFactor *
        this.WINRATE_FACTOR *
        (unit.wrLast20Games - desiredWinrate)
    );
  }

  public getPartyScore(v: PartyBalanceUnit): QueueUnit {
    const scoreSum = v.players.reduce((a, b) => a + this.getScore(b), 0);

    const totalPartyScore = scoreSum * BalanceService.getPartyFactor(v.players.length);

    return {
      partyId: v.partyId,
      players: v.players.length,
      totalScore: totalPartyScore,
    };
  }

  public rankedBalance(
    teamSize: number,
    parties: PartyInRoom[],
  ): RoomBalance {
    let radiantMMR = 0;
    let direMMR = 0;

    const radiantParties: PartyInRoom[] = [];
    const direParties: PartyInRoom[] = [];

    let radiantPlayerCount = 0;
    let direPlayerCount = 0;

    parties.forEach(it => {
      if (
        // if radiant less mmr and
        (radiantMMR <= direMMR && radiantPlayerCount < teamSize) ||
        direPlayerCount === teamSize
      ) {
        radiantParties.push(it);
        radiantPlayerCount += it.players.length;
        radiantMMR += it.totalMMR;
      } else if (
        (direMMR <= radiantMMR && direPlayerCount < teamSize) ||
        radiantPlayerCount === teamSize
      ) {
        direParties.push(it);
        direPlayerCount += it.players.length;
        direMMR += it.totalMMR;
      } else if (radiantPlayerCount < teamSize) {
        radiantParties.push(it);
        radiantPlayerCount += it.players.length;
        radiantMMR += it.totalMMR;
      } else if (direPlayerCount < teamSize) {
        direParties.push(it);
        direPlayerCount += it.players.length;
        direMMR += it.totalMMR;
      }
    });

    if (radiantPlayerCount !== teamSize || direPlayerCount !== teamSize) {
      throw new BalanceException()
    }

    return new RoomBalance(
      [radiantParties, direParties].map(list => new TeamEntry(list)),
    );
  }

}
