import { PartyId } from "gateway/gateway/shared-types/party-id";
import { MatchmakingMode } from "gateway/gateway/shared-types/matchmaking-mode";
import { Dota2Version } from "gateway/gateway/shared-types/dota2version";

export class PlayerLeaveQueueResolvedEvent {
  constructor(
    public readonly partyId: PartyId,
    public readonly mode: MatchmakingMode,
    public readonly version: Dota2Version,
  ) {}
}
