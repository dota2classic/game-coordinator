import { RuntimeRepository } from "src/@shared/runtime-repository";
import { EventPublisher } from "@nestjs/cqrs";
import { Injectable } from "@nestjs/common";
import { PartyInvitationModel } from "src/mm/party/model/party-invitation.model";

@Injectable()
export class PartyInvitationRepository extends RuntimeRepository<
  PartyInvitationModel,
  "id"
> {
  constructor(publisher: EventPublisher) {
    super(publisher);
  }
}
