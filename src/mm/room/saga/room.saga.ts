import { Injectable } from "@nestjs/common";
import { ICommand, ofType, Saga } from "@nestjs/cqrs";
import { Observable } from "rxjs";
import { StartEvent } from "src/mm/start.event";
import {map, mergeMap, tap} from "rxjs/operators";
import {MatchmakingModes, RoomSizes} from "src/gateway/gateway/shared-types/matchmaking-mode";
import { CreateQueueCommand } from "src/mm/queue/command/CreateQueue/create-queue.command";
import { GameFoundEvent } from "src/mm/queue/event/game-found.event";
import {
  CreateRoomCommand,
  PartyInRoom,
} from "src/mm/room/command/CreateRoom/create-room.command";
import { PlayerInPartyInRoom } from "src/mm/room/model/room-entry";
import {RoomCreatedEvent} from "src/mm/room/event/room-created.event";
import {RoomReadyCheckCommand} from "src/mm/room/command/RoomReadyCheck/room-ready-check.command";
import {ReadyStateReceivedEvent} from "src/gateway/gateway/events/ready-state-received.event";
import {SetReadyCheckCommand} from "src/mm/room/command/SetReadyCheck/set-ready-check.command";
import {RoomReadyCheckCompleteEvent} from "src/gateway/gateway/events/room-ready-check-complete.event";
import {FinalizeRoomCommand} from "src/mm/room/command/FinalizeRoom/finalize-room.command";

@Injectable()
export class RoomSaga {

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
      ofType(GameFoundEvent),
      map(
        e =>
          new CreateRoomCommand(
            e.mode,
            RoomSizes[e.mode],
            e.parties.map(
              party =>
                new PartyInRoom(
                  party.id,
                  party.players.map(
                    player => new PlayerInPartyInRoom(player.id, player.mmr),
                  ),
                ),
            ),
          ),
      ),
    );
  };

  @Saga()
  readyCheck = (events$: Observable<any>): Observable<ICommand> => {
    return events$.pipe(
      ofType(RoomCreatedEvent),
      map(t => new RoomReadyCheckCommand(t.id))
    );
  };

  @Saga()
  readyStateReceived = (events$: Observable<any>): Observable<ICommand> => {
    return events$.pipe(
      ofType(ReadyStateReceivedEvent),
      map(t => new SetReadyCheckCommand(t.playerID, t.roomID, t.state))
    );
  };

  @Saga()
  readyCheckComplete = (events$: Observable<any>): Observable<ICommand> => {
    return events$.pipe(
      ofType(RoomReadyCheckCompleteEvent),
      map(t => new FinalizeRoomCommand(t.id, t.mode, t.state))
    );
  };
}
