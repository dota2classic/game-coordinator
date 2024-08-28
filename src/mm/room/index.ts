import { RoomRepository } from "mm/room/repository/room.repository";
import { CreateRoomHandler } from "mm/room/command/CreateRoom/create-room.handler";
import { RoomReadyCheckHandler } from "mm/room/command/RoomReadyCheck/room-ready-check.handler";
import { SetReadyCheckHandler } from "mm/room/command/SetReadyCheck/set-ready-check.handler";
import { RoomSaga } from "mm/room/saga/room.saga";
import { FinalizeRoomHandler } from "mm/room/command/FinalizeRoom/finalize-room.handler";
import { GetUserRoomHandler } from "mm/room/query/get-user-room.handler";
import { RoomReadyHandler } from "mm/room/event-handler/room-ready.handler";
import { RoomNotReadyHandler } from "mm/room/event-handler/room-not-ready.handler";
import { BalanceService } from "mm/queue/service/balance.service";

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
