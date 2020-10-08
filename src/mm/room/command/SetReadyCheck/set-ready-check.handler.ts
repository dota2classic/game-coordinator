import {CommandHandler, ICommandHandler} from '@nestjs/cqrs';
import {Logger} from '@nestjs/common';
import {SetReadyCheckCommand} from "src/mm/room/command/SetReadyCheck/set-ready-check.command";
import {RoomRepository} from "src/mm/room/repository/room.repository";

@CommandHandler(SetReadyCheckCommand)
export class SetReadyCheckHandler implements ICommandHandler<SetReadyCheckCommand> {

  private readonly logger = new Logger(SetReadyCheckHandler.name)

  constructor(private readonly roomRepository: RoomRepository) {

  }

  async execute(command: SetReadyCheckCommand) {
    const room = await this.roomRepository.get(command.roomId);
    if(!room) return


    room.setReadyCheck(command.playerId, command.state)
    room.commit()
  }

}