import {CommandHandler, EventBus, ICommandHandler} from "@nestjs/cqrs";
import {Logger} from "@nestjs/common";
import {AcceptPartyInviteCommand} from "src/mm/party/command/AcceptPartyInvite/accept-party-invite.command";
import {PartyInvitationRepository} from "src/mm/party/repository/party-invitation.repository";
import {PartyRepository} from "src/mm/party/repository/party.repository";
import {PartyInviteResultEvent} from "src/gateway/gateway/events/party/party-invite-result.event";

@CommandHandler(AcceptPartyInviteCommand)
export class AcceptPartyInviteHandler
  implements ICommandHandler<AcceptPartyInviteCommand> {
  private readonly logger = new Logger(AcceptPartyInviteHandler.name);

  constructor(
    private readonly iRep: PartyInvitationRepository,
    private readonly pRep: PartyRepository,
    private readonly ebus: EventBus,
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

      if (currentParty.leader.value === invite.invited.value) {
        // if its single party
        // we can silently remove it
        await this.pRep.delete(currentParty.id);
        // party update not needed here.
        currentParty.uncommit()
        currentParty.deleted()
      }
      currentParty.commit()
    }

    if (command.accept) {
      party.add(invite.invited);
      party.commit();
    }

    this.ebus.publish(
      new PartyInviteResultEvent(invite.id, invite.invited, command.accept),
    );

    await this.iRep.delete(invite.id);
  }
}
