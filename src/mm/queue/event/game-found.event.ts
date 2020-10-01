import { MatchmakingMode } from "src/mm/queue/model/entity/matchmaking-mode";
import { PartyId } from "src/mm/party/model/party.model";

export class GameFoundEvent {
  constructor(public readonly mode: MatchmakingMode, public readonly parties: PartyId[]) {
  }
}