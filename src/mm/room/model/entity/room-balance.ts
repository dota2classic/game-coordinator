import {PartyInRoom} from "src/mm/room/command/CreateRoom/create-room.command";

export class TeamEntry {
  constructor(public readonly parties: PartyInRoom[]) {}
}

export class RoomBalance {
  constructor(public readonly teams: TeamEntry[]) {}

  public get totalMMR() {
    return this.teams
      .flatMap(t => t.parties.flatMap(t => t.totalMMR))
      .reduce((a, b) => a + b, 0);
  }

  public get averageMMR() {
    return (
      this.totalMMR /
      this.teams.flatMap(t => t.parties.length).reduce((a, b) => a + b, 0)
    );
  }
}
