import { PlayerId } from "src/mm/player/model/player.model";
import { MatchmakingMode } from "src/mm/queue/model/entity/matchmaking-mode";
import { PlayerInParty } from "src/mm/queue/event/game-found.event";

export class PlayerInPartyInRoom {
  constructor(public readonly id: string, public readonly mmr: number) {}
}

export class RoomEntry {
  constructor(
    public readonly partyId: PlayerId,
    public readonly players: PlayerInPartyInRoom[],
    public readonly mode: MatchmakingMode,
  ) {}
}
