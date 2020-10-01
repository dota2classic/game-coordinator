import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { LeaveQueueCommand } from "src/mm/queue/command/LeaveQueue/leave-queue.command";
import { QueueRepository } from "src/mm/queue/repository/queue.repository";

@CommandHandler(LeaveQueueCommand)
export class LeaveQueueHandler implements ICommandHandler<LeaveQueueCommand> {

  private readonly logger = new Logger(LeaveQueueHandler.name)

  constructor(private readonly queueRepository: QueueRepository) {

  }

  async execute({mode, partyId }: LeaveQueueCommand) {
    const q = await this.queueRepository.get(mode);
    q.removeEntry(partyId)

    q.commit()
  }

}