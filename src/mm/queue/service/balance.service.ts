import {Injectable} from "@nestjs/common";

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
}
