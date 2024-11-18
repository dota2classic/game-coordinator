import { CommandHandler, EventBus, ICommandHandler } from "@nestjs/cqrs";
import { Logger } from "@nestjs/common";
import { CreateRoomCommand } from "mm/room/command/CreateRoom/create-room.command";
import { RoomModel } from "mm/room/model/room.model";
import { RoomRepository } from "mm/room/repository/room.repository";
import { RoomCreatedEvent } from "mm/room/event/room-created.event";
import { BalanceService } from "mm/queue/service/balance.service";
import { LogEvent } from "gateway/gateway/events/log.event";

@CommandHandler(CreateRoomCommand)
export class CreateRoomHandler implements ICommandHandler<CreateRoomCommand> {
  private readonly logger = new Logger(CreateRoomHandler.name);

  constructor(
    private readonly roomRepository: RoomRepository,
    private readonly ebus: EventBus,
    private readonly balanceService: BalanceService,
  ) {}

  async execute({ balance, version, mode }: CreateRoomCommand) {
    const room = new RoomModel(
      mode,
      balance.teams.flatMap((t) => t.parties),
      balance,
      version,
    );
    await this.roomRepository.save(room.id, room);

    this.ebus.publish(new RoomCreatedEvent(room.id));
    return room.id;
  }
}
