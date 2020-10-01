import { PlayerId } from "src/mm/player/model/player.model";

export class PlayerInQueueEntity {
  constructor(
    public readonly playerId: PlayerId,
    public readonly mmr: number,
  ) {}
}
