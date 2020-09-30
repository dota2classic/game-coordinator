import { Injectable } from "@nestjs/common";
import { RuntimeRepository } from "src/@shared/runtime-repository";
import { PlayerModel } from "src/mm/player/model/player.model";
import { EventPublisher } from '@nestjs/cqrs';

@Injectable()
export class PlayerRepository extends RuntimeRepository<
  PlayerModel,
  "steamID"
> {
  constructor(publisher: EventPublisher) {
    super(publisher);
  }
}
