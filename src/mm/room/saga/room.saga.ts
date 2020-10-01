import { Injectable } from "@nestjs/common";
import { ICommand, ofType, Saga } from "@nestjs/cqrs";
import { Observable } from "rxjs";
import { StartEvent } from "src/mm/start.event";
import { filter, map, mergeMap } from "rxjs/operators";
import { MatchmakingModes } from "src/mm/queue/model/entity/matchmaking-mode";
import { CreateQueueCommand } from "src/mm/queue/command/CreateQueue/create-queue.command";
import { QueueUpdateEvent } from "src/mm/queue/event/queue-update.event";
import { RoomSizes } from "src/mm/room/model/entity/room-size";
import { CheckForGameCommand } from "src/mm/room/command/CheckForGame/check-for-game.command";

@Injectable()
export class QueueSaga {
  @Saga()
  createQueues = (events$: Observable<any>): Observable<ICommand> => {
    return events$.pipe(
      ofType(StartEvent),
      mergeMap(() => MatchmakingModes.map(it => new CreateQueueCommand(it))),
    );
  };

  @Saga()
  checkRoom = (events$: Observable<any>): Observable<ICommand> => {
    return events$.pipe(
      ofType(QueueUpdateEvent),
      map(e => new CheckForGameCommand(e.mode)),
    );
  };
}
