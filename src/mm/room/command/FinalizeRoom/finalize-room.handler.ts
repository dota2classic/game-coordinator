import {CommandHandler, ICommandHandler} from '@nestjs/cqrs';
import {Logger} from '@nestjs/common';
import {FinalizeRoomCommand} from "src/mm/room/command/FinalizeRoom/finalize-room.command";

@CommandHandler(FinalizeRoomCommand)
export class FinalizeRoomHandler
  implements ICommandHandler<FinalizeRoomCommand> {
  private readonly logger = new Logger(FinalizeRoomHandler.name);

  constructor() {}

  async execute(command: FinalizeRoomCommand) {
    // ok here we basically publish event of room-ready
  }
}
