import { CommandHandler, EventBus, ICommandHandler } from "@nestjs/cqrs";
import { Logger } from "@nestjs/common";
import { LeaveQueueCommand } from "mm/queue/command/LeaveQueue/leave-queue.command";
import { QueueRepository } from "mm/queue/repository/queue.repository";
import { PartyLeftQueueEvent } from "../../event/party-left-queue.event";

@CommandHandler(LeaveQueueCommand)
export class LeaveQueueHandler implements ICommandHandler<LeaveQueueCommand> {
  private readonly logger = new Logger(LeaveQueueHandler.name);

  constructor(
    private readonly queueRepository: QueueRepository,
    private readonly ebus: EventBus,
  ) {}

  async execute({ mode, partyId, version }: LeaveQueueCommand) {
    const q = await this.queueRepository.get(QueueRepository.id(mode, version));
    // this.logger.warn("Tried to leave not existing queue", { mode, version })
    if (!q) return;
    const p = q.removeEntry(partyId);
    q.commit();

    if (!p) return;
    this.ebus.publish(
      new PartyLeftQueueEvent(
        p.partyID,
        p.players.map((it) => it.playerId),
      ),
    );
  }
}
