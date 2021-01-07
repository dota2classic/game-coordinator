import { MatchmakingMode } from "src/gateway/gateway/shared-types/matchmaking-mode";
import { PlayerId } from "src/gateway/gateway/shared-types/player-id";
import {PlayerInQueueEntity} from "src/mm/queue/model/entity/player-in-queue.entity";

export class PlayerInPartyInRoom {
  constructor(
    public readonly id: PlayerId,
    public readonly mmr: number,
    public readonly recentWinrate: number,
    public readonly gamesPlayed: number,
  ) {}
}

export class RoomEntry {
  constructor(
    public readonly partyId: string,
    public readonly players: PlayerInQueueEntity[],
    public readonly mode: MatchmakingMode,
  ) {}
}
