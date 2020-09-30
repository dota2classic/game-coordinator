import { Injectable } from '@nestjs/common';
import { ICommand, ofType, Saga } from '@nestjs/cqrs';
import { StartEvent } from 'src/mm/start.event';
import { map, mergeMap } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { MatchmakingModes } from 'src/mm/queue/model/entity/matchmaking-mode';
import { CreateQueueCommand } from 'src/mm/queue/command/CreateQueue/create-queue.command';

@Injectable()
export class QueueSaga {

  @Saga()
  createQueues = (events$: Observable<any>): Observable<ICommand> => {
    return events$.pipe(
      ofType(StartEvent),
      mergeMap(() => MatchmakingModes.map(it => new CreateQueueCommand(it))),
    );
  };
}
