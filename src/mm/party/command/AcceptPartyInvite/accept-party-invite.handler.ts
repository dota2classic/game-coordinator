import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { Logger } from "@nestjs/common";
import { AcceptPartyInviteCommand } from "src/mm/party/command/AcceptPartyInvite/accept-party-invite.command";
import { PartyInvitationRepository } from "src/mm/party/repository/party-invitation.repository";
import { PartyRepository } from "src/mm/party/repository/party.repository";

@CommandHandler(AcceptPartyInviteCommand)
export class AcceptPartyInviteHandler
  implements ICommandHandler<AcceptPartyInviteCommand> {
  private readonly logger = new Logger(AcceptPartyInviteHandler.name);

  constructor(
    private readonly iRep: PartyInvitationRepository,
    private readonly pRep: PartyRepository,
  ) {}

  async execute(command: AcceptPartyInviteCommand) {
    const invite = await this.iRep.get(command.inviteId);
    if (!invite) return;

    const party = await this.pRep.get(invite.partyId);
    // no party no joining kappa.
    if (!party) return;

    const currentParty = await this.pRep.findExistingParty(invite.invited);

    if (currentParty) {
      currentParty.remove(invite.invited);
    }

    party.add(invite.invited);
  }
}
