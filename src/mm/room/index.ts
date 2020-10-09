import {RoomRepository} from "src/mm/room/repository/room.repository";
import {CreateRoomHandler} from "src/mm/room/command/CreateRoom/create-room.handler";
import {RoomReadyCheckHandler} from "src/mm/room/command/RoomReadyCheck/room-ready-check.handler";
import {SetReadyCheckHandler} from "src/mm/room/command/SetReadyCheck/set-ready-check.handler";
import {RoomSaga} from "src/mm/room/saga/room.saga";

const CommandHandlers = [
  CreateRoomHandler,
  RoomReadyCheckHandler,
  SetReadyCheckHandler,
];

const Repositories = [RoomRepository];

export const RoomProviders = [...CommandHandlers, ...Repositories, RoomSaga];
