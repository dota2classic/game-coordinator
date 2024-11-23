import { CommandHandler, EventBus, ICommandHandler } from "@nestjs/cqrs";
import { Logger } from "@nestjs/common";
import { AcceptPartyInviteCommand } from "mm/party/command/AcceptPartyInvite/accept-party-invite.command";
import { PartyInvitationRepository } from "mm/party/repository/party-invitation.repository";
import { PartyRepository } from "mm/party/repository/party.repository";
import { PartyInviteResultEvent } from "gateway/gateway/events/party/party-invite-result.event";

@CommandHandler(AcceptPartyInviteCommand)
export class AcceptPartyInviteHandler
  implements ICommandHandler<AcceptPartyInviteCommand>
{
  private readonly logger = new Logger(AcceptPartyInviteHandler.name);

  constructor(
    private readonly iRep: PartyInvitationRepository,
    private readonly pRep: PartyRepository,
    private readonly ebus: EventBus,
  ) {}

  async execute(command: AcceptPartyInviteCommand) {
    const invite = await this.iRep.get(command.inviteId);
    if (!invite) return;

    await this.iRep.delete(invite.id);

    const party = await this.pRep.get(invite.partyId);
    // no party no joining kappa.
    this.logger.log("Accept party: party to join", {
      party_id: party.id,
      inviter: invite.inviter.value,
      invited: invite.invited.value,
    });
    if (!party) {
      this.logger.warn("Accept party: trying to accept non-existing party", {
        party_id: invite.partyId,
        inviter: invite.inviter.value,
        invited: invite.invited.value,
      });
      return;
    }

    const currentParty = await this.pRep.findExistingParty(invite.invited);

    if (currentParty) {
      this.logger.log("Accept party: to join", {
        party_id: currentParty.id,
        inviter: invite.inviter.value,
        invited: invite.invited.value,
      });
      currentParty.remove(invite.invited);

      if (currentParty.leader.value === invite.invited.value) {
        // if its single party
        // we can silently remove it
        await this.pRep.delete(currentParty.id);
        // party update not needed here.
        currentParty.uncommit();
        currentParty.deleted();
      }
      currentParty.commit();
    }

    if (command.accept) {
      party.add(invite.invited);
      party.commit();
    }

    this.ebus.publish(
      new PartyInviteResultEvent(
        invite.id,
        invite.invited,
        command.accept,
        invite.inviter,
      ),
    );
  }
}
