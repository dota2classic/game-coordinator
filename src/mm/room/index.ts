import { RoomRepository } from "src/mm/room/repository/room.repository";
import { CreateRoomHandler } from "src/mm/room/command/CreateRoom/create-room.handler";
import { RoomReadyCheckHandler } from "src/mm/room/command/RoomReadyCheck/room-ready-check.handler";
import { SetReadyCheckHandler } from "src/mm/room/command/SetReadyCheck/set-ready-check.handler";
import { RoomSaga } from "src/mm/room/saga/room.saga";
import { FinalizeRoomHandler } from "src/mm/room/command/FinalizeRoom/finalize-room.handler";
import { GetUserRoomHandler } from "src/mm/room/query/get-user-room.handler";
import { RoomReadyHandler } from "src/mm/room/event-handler/room-ready.handler";
import { RoomNotReadyHandler } from "src/mm/room/event-handler/room-not-ready.handler";
import {BalanceService} from "src/mm/queue/service/balance.service";

const CommandHandlers = [
  CreateRoomHandler,
  RoomReadyCheckHandler,
  SetReadyCheckHandler,
  FinalizeRoomHandler,
];

const EventHandlers = [RoomNotReadyHandler, RoomReadyHandler];

const Repositories = [RoomRepository];

export const RoomProviders = [
  ...CommandHandlers,
  ...Repositories,
  ...EventHandlers,
  RoomSaga,
  BalanceService,
  GetUserRoomHandler,
];
