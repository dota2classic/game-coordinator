import { Injectable } from '@nestjs/common';
import { ICommand, ofType, Saga } from '@nestjs/cqrs';
import { StartEvent } from 'src/mm/start.event';
import { filter, map, mergeMap } from "rxjs/operators";
import { Observable } from 'rxjs';
import { MatchmakingModes } from 'src/gateway/shared-types/matchmaking-mode';
import { CreateQueueCommand } from 'src/mm/queue/command/CreateQueue/create-queue.command';
import { QueueUpdateEvent } from "src/mm/queue/event/queue-update.event";

@Injectable()
export class QueueSaga {

  @Saga()
  createQueues = (events$: Observable<any>): Observable<ICommand> => {
    return events$.pipe(
      ofType(StartEvent),
      mergeMap(() => MatchmakingModes.map(it => new CreateQueueCommand(it))),
    );
  };

  // @Saga()
  // checkRoom =  (events$: Observable<any>): Observable<ICommand> => {
  //   return events$.pipe(
  //     ofType(QueueUpdateEvent),
  //     filter(t => t.queueSize === ),
  //     mergeMap(() => MatchmakingModes.map(it => new CreateQueueCommand(it))),
  //   );
  // };
}
