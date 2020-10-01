import { PartyId } from "src/mm/party/model/party.model";
import { MatchmakingMode } from "src/mm/queue/model/entity/matchmaking-mode";

export class LeaveQueueCommand {
  constructor(public readonly mode: MatchmakingMode, public readonly partyId: PartyId) {
  }
}