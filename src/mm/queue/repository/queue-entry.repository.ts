import { RuntimeRepository } from "src/@shared/runtime-repository";
import { EventPublisher } from "@nestjs/cqrs";
import { QueueEntryModel } from "src/mm/queue/model/queue-entry.model";
import { Injectable } from "@nestjs/common";


@Injectable()
export class QueueEntryRepository extends RuntimeRepository<QueueEntryModel, "id">{
  constructor(publisher: EventPublisher) {
    super(publisher);
  }
}