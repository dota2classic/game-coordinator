import { QueueSaga } from "src/mm/queue/saga/queue.saga";
import { RoomRepository } from "src/mm/room/repository/room.repository";

const CommandHandlers = [];

const Repositories = [RoomRepository];

export const RoomProviders = [...CommandHandlers, ...Repositories, QueueSaga];
