import {Injectable} from "@nestjs/common";
import {ICommand, ofType, Saga} from "@nestjs/cqrs";
import {Observable} from "rxjs";
import {delay, map} from "rxjs/operators";
import {PartyInviteAcceptedEvent} from "src/gateway/gateway/events/party-invite-accepted.event";
import {AcceptPartyInviteCommand} from "src/mm/party/command/AcceptPartyInvite/accept-party-invite.command";
import {PartyInviteCreatedEvent} from "src/gateway/gateway/events/party-invite-created.event";
import {PARTY_INVITE_LIFETIME} from "src/gateway/gateway/shared-types/timings";
import {TimeoutPartyInviteCommand} from "src/mm/party/command/TimeoutPartyInvite/timeout-party-invite.command";

@Injectable()
export class PartySaga {
  @Saga()
  acceptInvite = (events$: Observable<any>): Observable<ICommand> => {
    return events$.pipe(
      ofType(PartyInviteAcceptedEvent),
      map(e => new AcceptPartyInviteCommand(e.inviteId)),
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
}
