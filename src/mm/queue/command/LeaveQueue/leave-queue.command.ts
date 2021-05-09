import { MatchmakingMode } from "src/gateway/gateway/shared-types/matchmaking-mode";
import { PartyId } from "src/gateway/gateway/shared-types/party-id";
import {Dota2Version} from "src/gateway/gateway/shared-types/dota2version";

export class LeaveQueueCommand {
  constructor(public readonly mode: MatchmakingMode, public readonly version: Dota2Version, public readonly partyId: PartyId) {
  }
}
