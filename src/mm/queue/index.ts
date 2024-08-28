import { QueueRepository } from "mm/queue/repository/queue.repository";
import { QueueSaga } from "mm/queue/saga/queue.saga";
import { CreateQueueHandler } from "mm/queue/command/CreateQueue/create-queue.handler";
import { EnterQueueHandler } from "mm/queue/command/EnterQueue/enter-queue.handler";
import { QueueService } from "mm/queue/service/queue.service";
import { LeaveQueueHandler } from "mm/queue/command/LeaveQueue/leave-queue.handler";
import { QueueStateHandler } from "mm/queue/query/GatewayQueueState/queue-state.handler";
import { PlayerEnterQueueHandler } from "mm/queue/command/PlayerEnterQueue/player-enter-queue.handler";
import { PlayerLeaveQueueHandler } from "mm/queue/command/PlayerLeaveQueue/player-leave-queue.handler";
import { PartyRepository } from "mm/party/repository/party.repository";
import { GetUserQueueHandler } from "mm/queue/query/get-user-queue.handler";
import { BalanceService } from "mm/queue/service/balance.service";
import { GameCheckCycleHandler } from "mm/queue/event-handler/game-check-cycle.handler";

const CommandHandlers = [
  CreateQueueHandler,
  EnterQueueHandler,
  LeaveQueueHandler,

  //gateway
  PlayerEnterQueueHandler,
  PlayerLeaveQueueHandler,
];

const QueryHandlers = [QueueStateHandler, GetUserQueueHandler];
const Repositories = [QueueRepository, PartyRepository];

const EventHandlers = [GameCheckCycleHandler];

export const QueueProviders = [
  ...CommandHandlers,
  ...QueryHandlers,
  ...Repositories,
  ...EventHandlers,
  QueueSaga,
  BalanceService,
  QueueService,
];
