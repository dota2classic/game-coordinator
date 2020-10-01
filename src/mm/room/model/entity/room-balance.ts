import { PartyInRoom } from "src/mm/room/command/CreateRoom/create-room.command";

export class TeamEntry {
  constructor(public readonly parties: PartyInRoom[]) {}
}

export class RoomBalance {
  constructor(public readonly teams: TeamEntry[]) {}
}
