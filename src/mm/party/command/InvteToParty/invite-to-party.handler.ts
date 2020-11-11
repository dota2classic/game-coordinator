import {CommandHandler, ICommandHandler} from "@nestjs/cqrs";
import {Logger} from "@nestjs/common";
import {InviteToPartyCommand} from "src/mm/party/command/InvteToParty/invite-to-party.command";
import {PartyInvitationRepository} from "src/mm/party/repository/party-invitation.repository";
import {PartyRepository} from "src/mm/party/repository/party.repository";
import {PartyInvitationModel} from "src/mm/party/model/party-invitation.model";

@CommandHandler(InviteToPartyCommand)
export class InviteToPartyHandler
  implements ICommandHandler<InviteToPartyCommand> {
  private readonly logger = new Logger(InviteToPartyHandler.name);

  constructor(
    private readonly pRep: PartyRepository,
    private readonly piRep: PartyInvitationRepository,
  ) {}

  async execute(command: InviteToPartyCommand) {
    const party = await this.pRep.getPartyOf(command.playerId);

    const invitation = new PartyInvitationModel(party.id, command.toInvite);
    invitation.created(party.leader);

    await this.piRep.save(invitation.id, invitation);

    invitation.commit();
    return invitation.id;
  }
}
