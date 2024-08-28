import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { Logger } from "@nestjs/common";
import { LeaveQueueCommand } from "mm/queue/command/LeaveQueue/leave-queue.command";
import { QueueRepository } from "mm/queue/repository/queue.repository";

@CommandHandler(LeaveQueueCommand)
export class LeaveQueueHandler implements ICommandHandler<LeaveQueueCommand> {
  private readonly logger = new Logger(LeaveQueueHandler.name);

  constructor(private readonly queueRepository: QueueRepository) {}

  async execute({ mode, partyId, version }: LeaveQueueCommand) {
    const q = await this.queueRepository.get(QueueRepository.id(mode, version));

    if (!q) return;
    q.removeEntry(partyId);
    q.commit();
  }
}
