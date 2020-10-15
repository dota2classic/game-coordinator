import { CommandHandler, EventBus, ICommandHandler } from "@nestjs/cqrs";
import { Logger } from "@nestjs/common";
import { FinalizeRoomCommand } from "src/mm/room/command/FinalizeRoom/finalize-room.command";
import { RoomReadyEvent } from "src/gateway/gateway/events/room-ready.event";
import { RoomRepository } from "src/mm/room/repository/room.repository";

@CommandHandler(FinalizeRoomCommand)
export class FinalizeRoomHandler
  implements ICommandHandler<FinalizeRoomCommand> {
  private readonly logger = new Logger(FinalizeRoomHandler.name);

  constructor(
    private readonly ebus: EventBus,
    private readonly roomRepository: RoomRepository,
  ) {}

  async execute(command: FinalizeRoomCommand) {
    const room = await this.roomRepository.get(command.roomId);
    if (!room) throw "No room";
    // ok here we basically publish event of room-ready

    const radiant = room.balance.teams[0].parties.flatMap(t => t.players.map(t => t.id))
    const dire = room.balance.teams[1].parties.flatMap(t => t.players.map(t => t.id))
    this.ebus.publish(
      new RoomReadyEvent(
        command.roomId,
        command.mode,
        radiant,
        dire,
        room.balance.averageMMR
      ),
    );
  }
}
