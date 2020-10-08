import { MatchmakingMode } from "../../../gateway/gateway/shared-types/matchmaking-mode";
import { PartyId } from "../../../gateway/gateway/shared-types/party-id";

export class PlayerInParty {
  constructor(public readonly id: string, public readonly mmr: number) {
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
