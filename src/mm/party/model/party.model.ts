import { AggregateRoot } from "@nestjs/cqrs";
import { PartyId } from "gateway/gateway/shared-types/party-id";
import { PlayerId } from "gateway/gateway/shared-types/player-id";
import { PartyCreatedEvent } from "mm/party/event/party-created.event";
import { PartyUpdatedEvent } from "gateway/gateway/events/party/party-updated.event";
import { PartyDeletedEvent } from "gateway/gateway/events/party/party-deleted.event";

export class PartyModel extends AggregateRoot {
  constructor(
    public readonly id: PartyId,
    public readonly leader: PlayerId,
    public players: PlayerId[],
  ) {
    super();
  }

  public created() {
    this.apply(new PartyCreatedEvent(this.id, this.leader, [...this.players]));
  }

  public updated() {
    this.apply(new PartyUpdatedEvent(this.id, this.leader, [...this.players]));
  }

  public remove(player: PlayerId) {
    if (this.leader.value === player.value) {
      // if it's already leader-only party do nothing.
      if (
        this.players.length === 1 &&
        this.players[0].value === this.leader.value
      )
        return;

      // if we are leader, we remove everyone except for leader.
      this.players = this.players.filter(t => t.value === player.value);
      this.updated();
      return;
    }

    const index = this.players.findIndex(t => t.value === player.value);
    if (index !== -1) {
      this.players.splice(index, 1);
      this.updated();
    }
  }

  public add(player: PlayerId) {
    // make sure no duplicates
    const index = this.players.findIndex(t => t.value === player.value);
    if (index !== -1) return;

    this.players.push(player);
    this.updated();
  }

  public deleted() {
    this.apply(new PartyDeletedEvent(this.id));
  }
}
