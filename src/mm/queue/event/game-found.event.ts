import { PartyId } from "../../../gateway/gateway/shared-types/party-id";
import { PlayerId } from "gateway/gateway/shared-types/player-id";
import { PlayerInQueueEntity } from "mm/queue/model/entity/player-in-queue.entity";
import { RoomBalance } from "mm/room/model/entity/room-balance";
import { Dota2Version } from "gateway/gateway/shared-types/dota2version";

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
    public readonly balance: RoomBalance,
    public readonly version: Dota2Version
  ) {}
}
