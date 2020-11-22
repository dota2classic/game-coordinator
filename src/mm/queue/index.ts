import { QueueRepository } from "src/mm/queue/repository/queue.repository";
import { QueueSaga } from "src/mm/queue/saga/queue.saga";
import { CreateQueueHandler } from "src/mm/queue/command/CreateQueue/create-queue.handler";
import { QueueEntryRepository } from "src/mm/queue/repository/queue-entry.repository";
import { EnterQueueHandler } from "src/mm/queue/command/EnterQueue/enter-queue.handler";
import { QueueService } from "src/mm/queue/service/queue.service";
import { LeaveQueueHandler } from "src/mm/queue/command/LeaveQueue/leave-queue.handler";
import { QueueStateHandler } from "src/mm/queue/query/GatewayQueueState/queue-state.handler";
import { PlayerEnterQueueHandler } from "src/mm/queue/command/PlayerEnterQueue/player-enter-queue.handler";
import { PlayerLeaveQueueHandler } from "src/mm/queue/command/PlayerLeaveQueue/player-leave-queue.handler";
import { PartyRepository } from "src/mm/party/repository/party.repository";
import {GetUserQueueHandler} from "src/mm/queue/query/get-user-queue.handler";
import {BalanceService} from "src/mm/queue/service/balance.service";

const CommandHandlers = [
  CreateQueueHandler,
  EnterQueueHandler,
  LeaveQueueHandler,

  //gateway
  PlayerEnterQueueHandler,
  PlayerLeaveQueueHandler,
];


const QueryHandlers = [QueueStateHandler, GetUserQueueHandler];
const Repositories = [QueueEntryRepository, QueueRepository, PartyRepository];


export const QueueProviders = [
  ...CommandHandlers,
  ...QueryHandlers,
  ...Repositories,
  QueueSaga,
  BalanceService,
  QueueService,
];