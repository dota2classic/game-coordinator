import { PlayerId, PlayerModel } from "src/mm/player/model/player.model";
import { AggregateRoot } from "@nestjs/cqrs";


export type PartyId = string;

export class PartyModel extends AggregateRoot{
  constructor(public readonly id: PartyId, public readonly leader: PlayerId, public readonly players: PlayerId[]) {
    super();
  }
}