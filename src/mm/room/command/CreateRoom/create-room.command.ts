import { PlayerInQueueEntity } from "mm/queue/model/entity/player-in-queue.entity";
import { RoomBalance } from "mm/room/model/entity/room-balance";
import { Dota2Version } from "gateway/gateway/shared-types/dota2version";
import { MatchmakingMode } from "gateway/gateway/shared-types/matchmaking-mode";

export class PartyInRoom {
  constructor(
    public readonly id: string,
    public readonly players: PlayerInQueueEntity[],
  ) {}
  //
  // public get totalMMR() {
  //   return this.players.reduce((a, b) => a + b.mmr, 0);
  // }
  //
  // public get averageMMR() {
  //   return this.totalMMR / this.players.length;
  // }
}
export class CreateRoomCommand {
  constructor(
    public readonly balance: RoomBalance,
    public readonly version: Dota2Version,
    public readonly mode: MatchmakingMode,
  ) {}
}
