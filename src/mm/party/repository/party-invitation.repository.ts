import { RuntimeRepository } from "@shared/runtime-repository";
import { EventPublisher } from "@nestjs/cqrs";
import { Injectable } from "@nestjs/common";
import { PartyInvitationModel } from "mm/party/model/party-invitation.model";
import { PlayerId } from "../../../gateway/gateway/shared-types/player-id";

@Injectable()
export class PartyInvitationRepository extends RuntimeRepository<
  PartyInvitationModel,
  "id"
> {
  constructor(publisher: EventPublisher) {
    super(publisher);
  }

  public getByReceiver = async (receiver: PlayerId): Promise<PartyInvitationModel[]> => {
    return this.all().then(invitations =>
      invitations.filter(inv => inv.invited.value === receiver.value),
    );
  };
}
