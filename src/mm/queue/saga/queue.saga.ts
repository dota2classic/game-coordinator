import { Injectable } from "@nestjs/common";
import { ICommand, ofType, Saga } from "@nestjs/cqrs";
import { StartEvent } from "src/mm/start.event";
import { map, mergeMap } from "rxjs/operators";
import { Observable } from "rxjs";
import { MatchmakingModes } from "src/gateway/gateway/shared-types/matchmaking-mode";
import { CreateQueueCommand } from "src/mm/queue/command/CreateQueue/create-queue.command";
import { PlayerEnterQueueResolvedEvent } from "src/mm/queue/event/player-enter-queue-resolved.event";
import { EnterQueueCommand } from "src/mm/queue/command/EnterQueue/enter-queue.command";
import { LeaveQueueCommand } from "src/mm/queue/command/LeaveQueue/leave-queue.command";
import { PlayerLeaveQueueResolvedEvent } from "src/mm/queue/event/player-leave-queue-resolved.event";
import { PartyUpdatedEvent } from "src/gateway/gateway/events/party/party-updated.event";
import { PartyDeletedEvent } from "src/gateway/gateway/events/party/party-deleted.event";
import { Dota2Version } from "src/gateway/gateway/shared-types/dota2version";

@Injectable()
export class QueueSaga {
  @Saga()
  createQueues = (events$: Observable<any>): Observable<ICommand> => {
    return events$.pipe(
      ofType(StartEvent),
      mergeMap(() =>
        MatchmakingModes.flatMap(it => [
          new CreateQueueCommand(it, Dota2Version.Dota_681),
          new CreateQueueCommand(it, Dota2Version.Dota_684),
        ]),
      ),
    );
  };

  @Saga()
  playerEnterQueue = (events$: Observable<any>): Observable<ICommand> => {
    return events$.pipe(
      ofType(PlayerEnterQueueResolvedEvent),
      map(e => new EnterQueueCommand(e.partyId, e.players, e.mode, e.version)),
    );
  };

  @Saga()
  playerLeaveQueue = (events$: Observable<any>): Observable<ICommand> => {
    return events$.pipe(
      ofType(PlayerLeaveQueueResolvedEvent),
      map(e => new LeaveQueueCommand(e.mode, e.version, e.partyId)),
    );
  };

  /**
   * If party is updated, remove it from queue. Simple as that
   * @param events$
   */
  @Saga()
  partyUpdated = (events$: Observable<any>): Observable<ICommand> => {
    return events$.pipe(
      ofType(PartyUpdatedEvent),
      mergeMap(e =>
        MatchmakingModes.flatMap(t => [
          new LeaveQueueCommand(t, Dota2Version.Dota_681, e.partyId),
          new LeaveQueueCommand(t, Dota2Version.Dota_684, e.partyId),
        ]),
      ),
    );
  };

  /**
   * If party is deleted, remove it from queue. Simple as that
   * @param events$
   */
  @Saga()
  partyDeleted = (events$: Observable<any>): Observable<ICommand> => {
    return events$.pipe(
      ofType(PartyDeletedEvent),
      mergeMap(e =>
        MatchmakingModes.flatMap(t => [
          new LeaveQueueCommand(t, Dota2Version.Dota_681, e.id),
          new LeaveQueueCommand(t, Dota2Version.Dota_684, e.id),
        ]),
      ),
    );
  };
}
