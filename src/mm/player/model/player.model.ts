import { AggregateRoot } from "@nestjs/cqrs";
import { RankedPlayerInfoEntity } from "src/mm/player/model/entity/ranked-player-info.entity";
import { PlayerId } from "src/gateway/shared-types/player-id";

export class PlayerModel extends AggregateRoot {
  constructor(
    public readonly steamID: PlayerId,
    public readonly ratingInfo: RankedPlayerInfoEntity,
  ) {
    super();
  }
}
