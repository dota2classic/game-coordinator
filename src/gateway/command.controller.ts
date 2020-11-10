import { Controller } from "@nestjs/common";
import { EventPattern } from "@nestjs/microservices";
import { construct } from "src/gateway/gateway/util/construct";
import { CommandBus, EventBus } from "@nestjs/cqrs";
import { PlayerEnterQueueCommand } from "./gateway/commands/player-enter-queue.command";
import { PlayerLeaveQueueCommand } from "./gateway/commands/player-leave-queue.command";
import { ReadyStateReceivedEvent } from "./gateway/events/ready-state-received.event";
import {LeavePartyCommand} from "src/gateway/gateway/commands/leave-party.command";

@Controller()
export class CommandController {
  constructor(
    private readonly cbus: CommandBus,
    private readonly ebus: EventBus,
  ) {}

  @EventPattern(PlayerEnterQueueCommand.name)
  async PlayerEnterQueueCommand(cmd: PlayerEnterQueueCommand) {
    await this.cbus.execute(construct(PlayerEnterQueueCommand, cmd));
  }

  @EventPattern(PlayerLeaveQueueCommand.name)
  async PlayerLeaveQueueCommand(cmd: PlayerLeaveQueueCommand) {
    await this.cbus.execute(construct(PlayerLeaveQueueCommand, cmd));
  }

  @EventPattern(ReadyStateReceivedEvent.name)
  async ReadyStateReceivedEvent(cmd: ReadyStateReceivedEvent) {
    await this.ebus.publish(construct(ReadyStateReceivedEvent, cmd));
  }

  @EventPattern(LeavePartyCommand.name)
  async LeavePartyCommand(cmd: LeavePartyCommand) {
    await this.ebus.publish(construct(LeavePartyCommand, cmd));
  }
}
