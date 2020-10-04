import { Controller } from "@nestjs/common";
import { EventPattern } from "@nestjs/microservices";
import { construct } from "src/gateway/gateway/util/construct";
import { CommandBus } from "@nestjs/cqrs";
import { PlayerEnterQueueCommand } from "./gateway/commands/player-enter-queue.command";

@Controller()
export class CommandController {
  constructor(private readonly cbus: CommandBus) {}

  @EventPattern("PlayerEnterQueueCommand")
  async PlayerEnterQueueCommand(cmd: PlayerEnterQueueCommand) {
    console.log(cmd, "he");
    await this.cbus.execute(construct(PlayerEnterQueueCommand, cmd));
  }
}