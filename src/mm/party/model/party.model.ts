import { AggregateRoot } from "@nestjs/cqrs";
import { PartyId } from "src/gateway/gateway/shared-types/party-id";
import { PlayerId } from "src/gateway/gateway/shared-types/player-id";
import { PartyCreatedEvent } from "src/mm/party/event/party-created.event";



export class PartyModel extends AggregateRoot {
  constructor(
    public readonly id: PartyId,
    public readonly leader: PlayerId,
    public readonly players: PlayerId[],
  ) {
    super();
  }


  public created(){
    this.apply(new PartyCreatedEvent(this.id, this.leader))
  }
}
