import { PartyId } from "src/gateway/gateway/shared-types/party-id";
import { PlayerInQueueEntity } from "src/mm/queue/model/entity/player-in-queue.entity";
import { MatchmakingMode } from "src/gateway/gateway/shared-types/matchmaking-mode";

export class PlayerLeaveQueueResolvedEvent {
  constructor(
    public readonly partyId: PartyId,
    public readonly mode: MatchmakingMode,
  ) {}
}
