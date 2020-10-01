import { MatchmakingMode } from "src/mm/queue/model/entity/matchmaking-mode";
import { FoundGameParty } from "src/mm/queue/event/game-found.event";
import { PlayerInPartyInRoom } from "src/mm/room/model/room-entry";

export class PartyInRoom {
  constructor(
    public readonly id: string,
    public readonly players: PlayerInPartyInRoom[],
  ) {}
}
export class CreateRoomCommand {
  constructor(
    public readonly mode: MatchmakingMode,
    public readonly size: number,
    public readonly parties: PartyInRoom[],
  ) {}
}
