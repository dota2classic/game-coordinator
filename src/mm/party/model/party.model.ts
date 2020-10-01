import { AggregateRoot } from "@nestjs/cqrs";
import { PartyId } from "src/gateway/gateway/shared-types/party-id";
import { PlayerId } from "src/gateway/gateway/shared-types/player-id";



export class PartyModel extends AggregateRoot {
  constructor(
    public readonly id: PartyId,
    public readonly leader: PlayerId,
    public readonly players: PlayerId[],
  ) {
    super();
  }
}
