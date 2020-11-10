import {CommandHandler, ICommandHandler} from "@nestjs/cqrs";
import {Logger} from "@nestjs/common";
import {TimeoutPartyInviteCommand} from "src/mm/party/command/TimeoutPartyInvite/timeout-party-invite.command";
import {PartyInvitationRepository} from "src/mm/party/repository/party-invitation.repository";

@CommandHandler(TimeoutPartyInviteCommand)
export class TimeoutPartyInviteHandler
  implements ICommandHandler<TimeoutPartyInviteCommand> {
  private readonly logger = new Logger(TimeoutPartyInviteHandler.name);

  constructor(private readonly partyInviteRep: PartyInvitationRepository) {}

  async execute(command: TimeoutPartyInviteCommand) {
    const invite = await this.partyInviteRep.get(command.inviteId);

    if (!invite) {
      return;
      // all good, accepted or invalid stuff
    }

    invite.expired();
    invite.commit();
    await this.partyInviteRep.delete(invite.id);
  }
}
