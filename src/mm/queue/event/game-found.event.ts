import {MatchmakingMode} from "../../../gateway/gateway/shared-types/matchmaking-mode";
import {PartyId} from "../../../gateway/gateway/shared-types/party-id";
import {PlayerId} from "src/gateway/gateway/shared-types/player-id";
import {PlayerInQueueEntity} from "src/mm/queue/model/entity/player-in-queue.entity";
import {QueueEntryModel} from "src/mm/queue/model/queue-entry.model";

export class PlayerInParty {
  constructor(
    public readonly id: PlayerId,
    public readonly mmr: number,
    public readonly recentWinrate: number,
    public readonly gamesPlayed: number,
  ) {}
}

export class FoundGameParty {
  constructor(
    public readonly id: PartyId,
    public readonly players: PlayerInQueueEntity[],
  ) {}
}
export class GameFoundEvent {
  constructor(
    public readonly mode: MatchmakingMode,
    public readonly parties: QueueEntryModel[],
  ) {}
}
