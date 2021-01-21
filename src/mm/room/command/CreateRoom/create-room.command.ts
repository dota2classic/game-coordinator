import { MatchmakingMode } from "src/gateway/gateway/shared-types/matchmaking-mode";
import { PlayerInPartyInRoom } from "src/mm/room/model/room-entry";
import {PlayerInQueueEntity} from "src/mm/queue/model/entity/player-in-queue.entity";
import {QueueEntryModel} from "src/mm/queue/model/queue-entry.model";
import {RoomBalance} from "src/mm/room/model/entity/room-balance";

export class PartyInRoom {
  constructor(
    public readonly id: string,
    public readonly players: PlayerInQueueEntity[],
  ) {}

  public get totalMMR() {
    return this.players.reduce((a, b) => a + b.mmr, 0);
  }

  public get averageMMR() {
    return this.totalMMR / this.players.length;
  }
}
export class CreateRoomCommand {
  constructor(
    public readonly balance: RoomBalance
  ) {}
}
