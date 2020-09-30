import { PartyId } from "src/mm/party/model/party.model";
import { MatchmakingMode } from "src/mm/queue/model/entity/matchmaking-mode";

export class EnterQueueCommand {
  constructor(
    public readonly partyId: PartyId,
    public readonly size: number,
    public readonly mode: MatchmakingMode,
  ) {}
}
