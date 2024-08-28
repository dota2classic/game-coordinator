import { AggregateRoot } from "@nestjs/cqrs";
import { RankedPlayerInfoEntity } from "mm/player/model/entity/ranked-player-info.entity";
import { PlayerId } from "gateway/gateway/shared-types/player-id";

export class PlayerModel extends AggregateRoot {
  constructor(
    public readonly steamID: PlayerId,
    public readonly ratingInfo: RankedPlayerInfoEntity,
  ) {
    super();
  }
}
