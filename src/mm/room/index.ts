import { QueueSaga } from "src/mm/queue/saga/queue.saga";
import { RoomRepository } from "src/mm/room/repository/room.repository";
import { CreateRoomHandler } from "src/mm/room/command/CreateRoom/create-room.handler";

const CommandHandlers = [CreateRoomHandler];

const Repositories = [RoomRepository];

export const RoomProviders = [...CommandHandlers, ...Repositories, QueueSaga];
