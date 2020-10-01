import { QueueSaga } from "src/mm/queue/saga/queue.saga";
import { RoomRepository } from "src/mm/room/repository/room.repository";
import { CheckForGameHandler } from "src/mm/room/command/CheckForGame/check-for-game.handler";

const CommandHandlers = [CheckForGameHandler];

const Repositories = [RoomRepository];

export const RoomProviders = [...CommandHandlers, ...Repositories, QueueSaga];
