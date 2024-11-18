import { Injectable } from "@nestjs/common";
import { RuntimeRepository } from "@shared/runtime-repository";
import { RoomModel } from "mm/room/model/room.model";
import { EventPublisher } from "@nestjs/cqrs";
import { PlayerId } from "gateway/gateway/shared-types/player-id";

@Injectable()
export class RoomRepository extends RuntimeRepository<RoomModel, "id"> {
  constructor(publisher: EventPublisher) {
    super(publisher);
  }

  async findWithPlayer(playerId: PlayerId): Promise<RoomModel | undefined> {
    return [...this.cache.values()].find((t) =>
      t.players.find((z) => z.playerId.value === playerId.value),
    );
  }
}
