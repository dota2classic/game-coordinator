import { Injectable } from "@nestjs/common";
import { ICommand, ofType, Saga } from "@nestjs/cqrs";
import { Observable } from "rxjs";
import { delay, map } from "rxjs/operators";
import { PartyInviteAcceptedEvent } from "src/gateway/gateway/events/party/party-invite-accepted.event";
import { AcceptPartyInviteCommand } from "src/mm/party/command/AcceptPartyInvite/accept-party-invite.command";
import { PartyInviteCreatedEvent } from "src/gateway/gateway/events/party/party-invite-created.event";
import { PARTY_INVITE_LIFETIME } from "src/gateway/gateway/shared-types/timings";
import { TimeoutPartyInviteCommand } from "src/mm/party/command/TimeoutPartyInvite/timeout-party-invite.command";
import { PartyInviteRequestedEvent } from "src/gateway/gateway/events/party/party-invite-requested.event";
import { InviteToPartyCommand } from "src/mm/party/command/InvteToParty/invite-to-party.command";

@Injectable()
export class PartySaga {
  @Saga()
  acceptInvite = (events$: Observable<any>): Observable<ICommand> => {
    return events$.pipe(
      ofType(PartyInviteAcceptedEvent),
      map(e => new AcceptPartyInviteCommand(e.inviteId, e.accept)),
    );
  };

  @Saga()
  timeoutInvite = (events$: Observable<any>): Observable<ICommand> => {
    return events$.pipe(
      ofType(PartyInviteCreatedEvent),
      delay(PARTY_INVITE_LIFETIME),
      map(e => new TimeoutPartyInviteCommand(e.id)),
    );
  };

  @Saga()
  inviteRequested = (events$: Observable<any>): Observable<ICommand> => {
    return events$.pipe(
      ofType(PartyInviteRequestedEvent),
      map(e => new InviteToPartyCommand(e.requestedBy, e.receiver)),
    );
  };


}
