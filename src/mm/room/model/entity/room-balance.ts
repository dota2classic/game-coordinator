import { QueueEntryModel } from "mm/queue/model/queue-entry.model";
import { MatchmakingMode } from "gateway/gateway/shared-types/matchmaking-mode";

export class TeamEntry {
  public readonly averageScore: number;
  constructor(
    public readonly parties: QueueEntryModel[],
    public readonly totalScore: number = parties.reduce(
      (a, b) => a + b.score,
      0,
    ),
  ) {
    this.averageScore = totalScore / parties.reduce((a, b) => a + b.size, 0);
  }
}

export class RoomBalance {
  constructor(public readonly teams: TeamEntry[], public mode: MatchmakingMode) {}

  // public get totalMMR() {
  //   return this.teams
  //     .flatMap(t => t.parties.flatMap(t => t.totalMMR))
  //     .reduce((a, b) => a + b, 0);
  // }

  // public get averageMMR() {
  //   return (
  //     this.totalMMR /
  //     this.teams
  //       .map(t => t.parties.reduce((a, b) => a + b.size, 0))
  //       .reduce((a, b) => a + b, 0)
  //   );
  // }

  // public get mmrMedian() {
  //   const allMMrs = this.teams
  //     .flatMap(t => t.parties)
  //     .flatMap(t => t.players)
  //     .map(t => t.mmr)
  //     .sort((a, b) => b - a);
  //
  //   const mid = Math.ceil(allMMrs.length / 2);
  //
  //
  //   return allMMrs.length % 2 == 0 ? (allMMrs[mid] + allMMrs[mid - 1]) / 2 : allMMrs[mid - 1];
  // }
}
