import { Injectable } from "@nestjs/common";
import { ICommand, ofType, Saga } from "@nestjs/cqrs";
import { Observable } from "rxjs";
import { StartEvent } from "src/mm/start.event";
import { map, mergeMap } from "rxjs/operators";
import { MatchmakingModes } from "src/gateway/shared-types/matchmaking-mode";
import { CreateQueueCommand } from "src/mm/queue/command/CreateQueue/create-queue.command";
import { RoomSizes } from "src/mm/room/model/entity/room-size";
import { GameFoundEvent } from "src/mm/queue/event/game-found.event";
import {
  CreateRoomCommand,
  PartyInRoom,
} from "src/mm/room/command/CreateRoom/create-room.command";
import { PlayerInPartyInRoom } from "src/mm/room/model/room-entry";

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
}
