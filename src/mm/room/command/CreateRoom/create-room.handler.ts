import { CommandHandler, EventBus, ICommandHandler } from "@nestjs/cqrs";
import { Logger } from "@nestjs/common";
import { CreateRoomCommand } from "src/mm/room/command/CreateRoom/create-room.command";
import { RoomModel } from "src/mm/room/model/room.model";
import { RoomEntry } from "src/mm/room/model/room-entry";
import { RoomRepository } from "src/mm/room/repository/room.repository";
import { RoomCreatedEvent } from "src/mm/room/event/room-created.event";

@CommandHandler(CreateRoomCommand)
export class CreateRoomHandler implements ICommandHandler<CreateRoomCommand> {
  private readonly logger = new Logger(CreateRoomHandler.name);

  constructor(
    private readonly roomRepository: RoomRepository,
    private readonly ebus: EventBus,
  ) {}

  async execute({ parties, mode }: CreateRoomCommand) {
    const room = new RoomModel(
      parties.map(t => new RoomEntry(t.id, t.players, mode)),
    );
    await this.roomRepository.save(room.id, room);

    this.ebus.publish(new RoomCreatedEvent(room.id));

    return room.id;
  }
}
