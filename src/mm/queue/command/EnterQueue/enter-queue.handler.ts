import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { Logger } from "@nestjs/common";
import { EnterQueueCommand } from "src/mm/queue/command/EnterQueue/enter-queue.command";
import { QueueRepository } from "src/mm/queue/repository/queue.repository";
import { QueueEntryModel } from "src/mm/queue/model/queue-entry.model";
import { QueueEntryRepository } from "src/mm/queue/repository/queue-entry.repository";

@CommandHandler(EnterQueueCommand)
export class EnterQueueHandler implements ICommandHandler<EnterQueueCommand> {
  private readonly logger = new Logger(EnterQueueHandler.name);

  constructor(
    private readonly queueRepository: QueueRepository,
    private readonly queueEntryRepository: QueueEntryRepository,
  ) {}

  async execute({ partyId, mode, size }: EnterQueueCommand) {
    const q = await this.queueRepository.get(mode);
    if (!q) return;

    const entry = new QueueEntryModel(partyId, mode, size);
    await this.queueEntryRepository.save(entry.id, entry);

    q.addEntry(entry);
    q.commit();


    return entry.id;
  }
}
