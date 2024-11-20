import { QueueEntryModel } from "mm/queue/model/queue-entry.model";

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
  constructor(public readonly teams: TeamEntry[]) {}
}
