import { Injectable } from "@nestjs/common";
import { ICommand, ofType, Saga } from "@nestjs/cqrs";
import { Observable } from "rxjs";
import { map, mergeMap } from "rxjs/operators";
import { GameFoundEvent } from "mm/queue/event/game-found.event";
import { CreateRoomCommand } from "mm/room/command/CreateRoom/create-room.command";
import { RoomCreatedEvent } from "mm/room/event/room-created.event";
import { RoomReadyCheckCommand } from "mm/room/command/RoomReadyCheck/room-ready-check.command";
import { ReadyStateReceivedEvent } from "gateway/gateway/events/ready-state-received.event";
import { SetReadyCheckCommand } from "mm/room/command/SetReadyCheck/set-ready-check.command";
import { RoomReadyCheckCompleteEvent } from "gateway/gateway/events/room-ready-check-complete.event";
import { FinalizeRoomCommand } from "mm/room/command/FinalizeRoom/finalize-room.command";
import { BadRoomFinalizedEvent } from "mm/room/event/bad-room-finalized.event";
import { EnterQueueCommand } from "mm/queue/command/EnterQueue/enter-queue.command";

@Injectable()
export class RoomSaga {
  @Saga()
  checkRoom = (events$: Observable<any>): Observable<ICommand> => {
    return events$.pipe(
      ofType(GameFoundEvent),
      map(e => new CreateRoomCommand(e.balance, e.version)),
    );
  };

  @Saga()
  readyCheck = (events$: Observable<any>): Observable<ICommand> => {
    return events$.pipe(
      ofType(RoomCreatedEvent),
      map(t => new RoomReadyCheckCommand(t.id)),
    );
  };

  @Saga()
  readyStateReceived = (events$: Observable<any>): Observable<ICommand> => {
    return events$.pipe(
      ofType(ReadyStateReceivedEvent),
      map(t => new SetReadyCheckCommand(t.playerID, t.roomID, t.state)),
    );
  };

  @Saga()
  readyCheckComplete = (events$: Observable<any>): Observable<ICommand> => {
    return events$.pipe(
      ofType(RoomReadyCheckCompleteEvent),
      map(t => new FinalizeRoomCommand(t.id, t.mode, t.state)),
    );
  };

  @Saga()
  badRoomFinalized = (events$: Observable<any>): Observable<ICommand> => {
    return events$.pipe(
      ofType(BadRoomFinalizedEvent),
      mergeMap(t =>
        t.goodParties.map(
          t => new EnterQueueCommand(t.partyID, t.players, t.mode, t.version),
        ),
      ),
    );
  };
}
