import { MatchmakingMode } from "src/mm/queue/model/entity/matchmaking-mode";
import { PartyId } from "src/mm/party/model/party.model";
import { QueueEntryModel } from "src/mm/queue/model/queue-entry.model";

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
