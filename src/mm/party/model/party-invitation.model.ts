import {AggregateRoot} from "@nestjs/cqrs";
import {PartyId} from "src/gateway/gateway/shared-types/party-id";
import {PlayerId} from "src/gateway/gateway/shared-types/player-id";
import {PartyInviteCreatedEvent} from "src/gateway/gateway/events/party/party-invite-created.event";
import {uuid} from "src/@shared/generateID";
import {PartyInviteExpiredEvent} from "src/gateway/gateway/events/party/party-invite-expired.event";

export class PartyInvitationModel extends AggregateRoot {
  public readonly id: string;
  constructor(
    public readonly partyId: PartyId,
    public readonly invited: PlayerId,
    public readonly inviter: PlayerId
  ) {
    super();
    this.id = uuid();
  }

  public created() {
    this.apply(new PartyInviteCreatedEvent(this.id, this.partyId, this.inviter, this.invited));
  }

  expired() {
    this.apply(new PartyInviteExpiredEvent(this.id, this.invited, this.partyId, this.inviter))
  }
}
