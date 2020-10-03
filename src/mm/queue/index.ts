import { QueueRepository } from "src/mm/queue/repository/queue.repository";
import { QueueSaga } from "src/mm/queue/saga/queue.saga";
import { CreateQueueHandler } from "src/mm/queue/command/CreateQueue/create-queue.handler";
import { QueueEntryRepository } from "src/mm/queue/repository/queue-entry.repository";
import { EnterQueueHandler } from "src/mm/queue/command/EnterQueue/enter-queue.handler";
import { QueueService } from "src/mm/queue/service/queue.service";
import { LeaveQueueHandler } from "src/mm/queue/command/LeaveQueue/leave-queue.handler";
import { QueueStateHandler } from "src/mm/queue/query/GatewayQueueState/queue-state.handler";

const CommandHandlers = [
  CreateQueueHandler,
  EnterQueueHandler,
  LeaveQueueHandler,
];

const QueryHandlers = [
  QueueStateHandler
]
const Repositories = [QueueEntryRepository, QueueRepository];

export const QueueProviders = [
  ...CommandHandlers,
  ...QueryHandlers,
  ...Repositories,
  QueueSaga,
  QueueService,
];
