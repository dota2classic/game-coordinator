import { IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import { Logger } from "@nestjs/common";
import { GetPartyInvitationsQuery } from "../../../../gateway/gateway/queries/GetPartyInvitations/get-party-invitations.query";
import { GetPartyInvitationsQueryResult } from "../../../../gateway/gateway/queries/GetPartyInvitations/get-party-invitations-query.result";
import { PartyRepository } from "../../repository/party.repository";
import { PartyInvitationRepository } from "../../repository/party-invitation.repository";
import { PartyInviteCreatedEvent } from "../../../../gateway/gateway/events/party/party-invite-created.event";

@QueryHandler(GetPartyInvitationsQuery)
export class GetPartyInvitationsHandler
  implements
    IQueryHandler<GetPartyInvitationsQuery, GetPartyInvitationsQueryResult> {
  private readonly logger = new Logger(GetPartyInvitationsHandler.name);

  constructor(
    private readonly partyRepository: PartyRepository,
    private readonly piRep: PartyInvitationRepository,
  ) {}

  async execute(
    command: GetPartyInvitationsQuery,
  ): Promise<GetPartyInvitationsQueryResult> {
    const invs = await this.piRep.getByReceiver(command.playerId);
    return new GetPartyInvitationsQueryResult(
      command.playerId,
      invs.map(
        inv =>
          new PartyInviteCreatedEvent(
            inv.id,
            inv.partyId,
            inv.inviter,
            inv.invited,
          ),
      ),
    );
  }
}
