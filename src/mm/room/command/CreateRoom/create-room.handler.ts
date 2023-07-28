import {CommandHandler, EventBus, ICommandHandler} from "@nestjs/cqrs";
import {Logger} from "@nestjs/common";
import {CreateRoomCommand, PartyInRoom,} from "src/mm/room/command/CreateRoom/create-room.command";
import {RoomModel} from "src/mm/room/model/room.model";
import {RoomEntry} from "src/mm/room/model/room-entry";
import {RoomRepository} from "src/mm/room/repository/room.repository";
import {RoomCreatedEvent} from "src/mm/room/event/room-created.event";
import {MatchmakingMode, RoomSizes} from "src/gateway/gateway/shared-types/matchmaking-mode";
import {RoomBalance} from "src/mm/room/model/entity/room-balance";
import {RoomImpossibleEvent} from "src/gateway/gateway/events/mm/room-impossible.event";
import {BalanceService} from "src/mm/queue/service/balance.service";
import {QueueEntryModel} from "src/mm/queue/model/queue-entry.model";
import {LogEvent} from "src/gateway/gateway/events/log.event";

@CommandHandler(CreateRoomCommand)
export class CreateRoomHandler implements ICommandHandler<CreateRoomCommand> {
  private readonly logger = new Logger(CreateRoomHandler.name);

  constructor(
    private readonly roomRepository: RoomRepository,
    private readonly ebus: EventBus,
    private readonly balanceService: BalanceService,
  ) {}

  async execute({ balance, version }: CreateRoomCommand) {
    const room = new RoomModel(
      balance.mode,
      balance.teams.flatMap(t => t.parties),
      balance,
      version
    );
    await this.roomRepository.save(room.id, room);

    this.ebus.publish(new RoomCreatedEvent(room.id));
    this.logger.log(JSON.stringify(room.balance))


    this.ebus.publish(new LogEvent(`Создана игра. Состав команд:\n \`${JSON.stringify(room.balance)}\``))
  }

}
