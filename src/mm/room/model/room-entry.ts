import { MatchmakingMode } from "src/gateway/shared-types/matchmaking-mode";
import { PlayerId } from "src/gateway/shared-types/player-id";

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
