import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { Logger } from "@nestjs/common";
import { CheckForGameCommand } from "src/mm/room/command/CheckForGame/check-for-game.command";
import { RoomSizes } from "src/mm/room/model/entity/room-size";
import { RoomModel } from "src/mm/room/model/room.model";
import { RoomRepository } from "src/mm/room/repository/room.repository";

@CommandHandler(CheckForGameCommand)
export class CheckForGameHandler
  implements ICommandHandler<CheckForGameCommand> {
  private readonly logger = new Logger(CheckForGameHandler.name);

  constructor(private readonly roomRepository: RoomRepository) {}

  async execute({ mode, queueSize }: CheckForGameCommand) {
    if (queueSize >= RoomSizes[mode]) {
      //
      // // ok we can do room here
      // const room = new RoomModel();
      // await this.roomRepository.save(room.id, room);
      //
      // return room.id;
    }
  }
}
