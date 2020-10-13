import { MatchmakingMode } from "../../../gateway/gateway/shared-types/matchmaking-mode";
import { PartyId } from "../../../gateway/gateway/shared-types/party-id";
import {PlayerId} from "src/gateway/gateway/shared-types/player-id";

export class PlayerInParty {
  constructor(public readonly id: PlayerId, public readonly mmr: number) {
  }
}

export class FoundGameParty {
  constructor(public readonly id: PartyId, public readonly players: PlayerInParty[]) {
  }
}
export class GameFoundEvent {
  constructor(
    public readonly mode: MatchmakingMode,
    public readonly parties: FoundGameParty[],
  ) {}
}
