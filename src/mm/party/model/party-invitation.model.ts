import { AggregateRoot } from "@nestjs/cqrs";
import { PartyId } from "gateway/gateway/shared-types/party-id";
import { PlayerId } from "gateway/gateway/shared-types/player-id";
import { PartyInviteCreatedEvent } from "gateway/gateway/events/party/party-invite-created.event";
import { uuid } from "@shared/generateID";
import { PartyInviteExpiredEvent } from "gateway/gateway/events/party/party-invite-expired.event";
import { PartyInviteResultEvent } from "gateway/gateway/events/party/party-invite-result.event";

export class PartyInvitationModel extends AggregateRoot {
  public readonly id: string;
  constructor(
    public readonly partyId: PartyId,
    public readonly invited: PlayerId,
    public readonly inviter: PlayerId,
  ) {
    super();
    this.id = uuid();
  }

  public created() {
    this.apply(
      new PartyInviteCreatedEvent(
        this.id,
        this.partyId,
        this.inviter,
        this.invited,
      ),
    );
  }

  expired() {
    this.apply(
      new PartyInviteResultEvent(this.id, this.invited, false, this.inviter),
    );
    this.apply(
      new PartyInviteExpiredEvent(
        this.id,
        this.invited,
        this.partyId,
        this.inviter,
      ),
    );
  }
}
