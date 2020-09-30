import { RuntimeRepository } from 'src/@shared/runtime-repository';
import { QueueModel } from 'src/mm/queue/model/queue.model';
import { Injectable } from '@nestjs/common';
import { EventPublisher } from '@nestjs/cqrs';

@Injectable()
export class QueueRepository extends RuntimeRepository<QueueModel, 'mode'>{

  constructor(publisher: EventPublisher) {
    super(publisher);
  }
}