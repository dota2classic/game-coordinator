import { AggregateRoot } from "@nestjs/cqrs";
import { PartyId } from "src/gateway/shared-types/party-id";
import { PlayerId } from "src/gateway/shared-types/player-id";



export class PartyModel extends AggregateRoot {
  constructor(
    public readonly id: PartyId,
    public readonly leader: PlayerId,
    public readonly players: PlayerId[],
  ) {
    super();
  }
}
