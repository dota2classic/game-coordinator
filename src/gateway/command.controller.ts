import { Controller } from "@nestjs/common";
import { EventPattern } from "@nestjs/microservices";
import { construct } from "src/gateway/gateway/util/construct";
import { CommandBus } from "@nestjs/cqrs";
import { PlayerEnterQueueCommand } from "./gateway/commands/player-enter-queue.command";
import { PlayerLeaveQueueCommand } from "./gateway/commands/player-leave-queue.command";

@Controller()
export class CommandController {
  constructor(private readonly cbus: CommandBus) {}

  @EventPattern(PlayerEnterQueueCommand.name)
  async PlayerEnterQueueCommand(cmd: PlayerEnterQueueCommand) {
    await this.cbus.execute(construct(PlayerEnterQueueCommand, cmd));
  }

  @EventPattern(PlayerLeaveQueueCommand.name)
  async PlayerLeaveQueueCommand(cmd: PlayerLeaveQueueCommand) {
    await this.cbus.execute(construct(PlayerLeaveQueueCommand, cmd));
  }
}