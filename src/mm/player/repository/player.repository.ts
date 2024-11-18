import { Injectable } from "@nestjs/common";
import { RuntimeRepository } from "@shared/runtime-repository";
import { PlayerModel } from "mm/player/model/player.model";
import { EventPublisher } from "@nestjs/cqrs";

@Injectable()
export class PlayerRepository extends RuntimeRepository<
  PlayerModel,
  "steamID"
> {
  constructor(publisher: EventPublisher) {
    super(publisher);
  }
}
