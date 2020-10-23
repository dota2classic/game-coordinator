import {CommandHandler, EventBus, ICommandHandler} from "@nestjs/cqrs";
import {Logger} from "@nestjs/common";
import {RoomReadyCheckCommand} from "src/mm/room/command/RoomReadyCheck/room-ready-check.command";
import {RoomRepository} from "src/mm/room/repository/room.repository";

@CommandHandler(RoomReadyCheckCommand)
export class RoomReadyCheckHandler
  implements ICommandHandler<RoomReadyCheckCommand> {
  private readonly logger = new Logger(RoomReadyCheckHandler.name);

  constructor(private readonly roomRepository: RoomRepository, private readonly ebus: EventBus) {}

  async execute(command: RoomReadyCheckCommand) {
    const room = await this.roomRepository.get(command.roomID);
    if(!room) return;

    // setup timeout
    setTimeout(() => {
      room.readyCheckTimeout();
      room.commit()
    }, 10_000);


    room.startReadyCheck();
    room.commit()

  }
}
