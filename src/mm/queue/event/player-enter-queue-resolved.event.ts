import { PartyId } from "src/gateway/gateway/shared-types/party-id";
import { PlayerInQueueEntity } from "src/mm/queue/model/entity/player-in-queue.entity";
import { MatchmakingMode } from "src/gateway/gateway/shared-types/matchmaking-mode";
import {Dota2Version} from "src/gateway/gateway/shared-types/dota2version";

export class PlayerEnterQueueResolvedEvent {
  constructor(
    public readonly partyId: PartyId,
    public readonly players: PlayerInQueueEntity[],
    public readonly mode: MatchmakingMode,
    public readonly version: Dota2Version
  ) {}
}
