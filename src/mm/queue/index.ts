import { QueueRepository } from 'src/mm/queue/repository/queue.repository';
import { QueueSaga } from 'src/mm/queue/saga/queue.saga';
import { CreateQueueHandler } from 'src/mm/queue/command/CreateQueue/create-queue.handler';

const CommandHandlers = [CreateQueueHandler];

export const QueueProviders = [...CommandHandlers, QueueRepository, QueueSaga];