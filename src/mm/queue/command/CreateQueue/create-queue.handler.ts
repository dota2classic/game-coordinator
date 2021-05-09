import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { Logger } from "@nestjs/common";
import { CreateQueueCommand } from "src/mm/queue/command/CreateQueue/create-queue.command";
import { QueueRepository } from "src/mm/queue/repository/queue.repository";
import { QueueModel } from "src/mm/queue/model/queue.model";

@CommandHandler(CreateQueueCommand)
export class CreateQueueHandler implements ICommandHandler<CreateQueueCommand> {
  private readonly logger = new Logger(CreateQueueHandler.name);

  constructor(private readonly queueRepository: QueueRepository) {}

  async execute({ mode, version }: CreateQueueCommand) {
    // check if exists
    const existing = await this.queueRepository.get(QueueRepository.id(mode, version));
    if (existing) return;

    const queue = new QueueModel(mode, version);
    await this.queueRepository.save(QueueRepository.id(mode, version), queue);

    queue.init();
    queue.commit();

    return queue.mode;
  }
}
