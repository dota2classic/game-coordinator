import {PartyRepository} from "src/mm/party/repository/party.repository";
import {LeavePartyHandler} from "src/mm/party/command/LeaveParty/leave-party.handler";
import {InviteToPartyHandler} from "src/mm/party/command/InvteToParty/invite-to-party.handler";
import {PartyInvitationRepository} from "src/mm/party/repository/party-invitation.repository";
import {PartySaga} from "src/mm/party/saga/party.saga";
import {AcceptPartyInviteHandler} from "src/mm/party/command/AcceptPartyInvite/accept-party-invite.handler";
import {TimeoutPartyInviteHandler} from "src/mm/party/command/TimeoutPartyInvite/timeout-party-invite.handler";
import {PartyController} from "src/mm/party/party.controller";

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
  PartyController,
];
