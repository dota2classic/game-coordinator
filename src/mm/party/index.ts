import { PartyRepository } from "mm/party/repository/party.repository";
import { LeavePartyHandler } from "mm/party/command/LeaveParty/leave-party.handler";
import { InviteToPartyHandler } from "mm/party/command/InvteToParty/invite-to-party.handler";
import { PartyInvitationRepository } from "mm/party/repository/party-invitation.repository";
import { PartySaga } from "mm/party/saga/party.saga";
import { AcceptPartyInviteHandler } from "mm/party/command/AcceptPartyInvite/accept-party-invite.handler";
import { TimeoutPartyInviteHandler } from "mm/party/command/TimeoutPartyInvite/timeout-party-invite.handler";
import { GetPartyHandler } from "mm/party/query/GetParty/get-party.handler";

const CommandHandlers = [
  LeavePartyHandler,
  InviteToPartyHandler,
  AcceptPartyInviteHandler,
  TimeoutPartyInviteHandler,
];

const Repositories = [PartyInvitationRepository, PartyRepository];

export const PartyProviders = [
  ...CommandHandlers,
  ...Repositories,
  PartySaga,
  GetPartyHandler
];
