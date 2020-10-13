import { MatchmakingMode } from "src/gateway/gateway/shared-types/matchmaking-mode";
import { PlayerId } from "src/gateway/gateway/shared-types/player-id";

export class PlayerInPartyInRoom {
  constructor(public readonly id: PlayerId, public readonly mmr: number) {}
}

export class RoomEntry {
  constructor(
    public readonly partyId: string,
    public readonly players: PlayerInPartyInRoom[],
    public readonly mode: MatchmakingMode,
  ) {}
}
