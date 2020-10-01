import { AggregateRoot } from "@nestjs/cqrs";
import { RankedPlayerInfoEntity } from "src/mm/player/model/entity/ranked-player-info.entity";

export type PlayerId = string;
export class PlayerModel extends AggregateRoot {
  constructor(
    public readonly steamID: PlayerId,
    public readonly ratingInfo: RankedPlayerInfoEntity,
  ) {
    super();
  }
}
