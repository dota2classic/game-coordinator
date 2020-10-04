import { Controller } from "@nestjs/common";
import { MessagePattern } from "@nestjs/microservices";
import { QueueStateQueryResult } from "src/gateway/gateway/queries/QueueState/queue-state-query.result";
import { construct } from "src/gateway/gateway/util/construct";
import { CommandBus } from "@nestjs/cqrs";
import { PlayerEnterQueueCommand } from "./gateway/commands/player-enter-queue.command";

@Controller()
export class CommandController {

  constructor(
    private readonly cbus: CommandBus
  ) {
  }

  @MessagePattern(PlayerEnterQueueCommand.name)
  async PlayerEnterQueueCommand(
    query: PlayerEnterQueueCommand,
  ): Promise<QueueStateQueryResult> {
    return this.cbus.execute(construct(PlayerEnterQueueCommand, query));
  }
}