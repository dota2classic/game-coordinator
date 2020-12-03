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

@CommandHandler(CreateRoomCommand)
export class CreateRoomHandler implements ICommandHandler<CreateRoomCommand> {
  private readonly logger = new Logger(CreateRoomHandler.name);

  constructor(
    private readonly roomRepository: RoomRepository,
    private readonly ebus: EventBus,
    private readonly balanceService: BalanceService
  ) {}

  async execute({ parties, mode }: CreateRoomCommand) {
    try {
      const balance = await this.balanceRoom(parties, mode);

      const room = new RoomModel(
        mode,
        parties.map(t => new RoomEntry(t.id, t.players, mode)),
        balance,
      );
      await this.roomRepository.save(room.id, room);

      this.ebus.publish(new RoomCreatedEvent(room.id));

      return room.id;
    } catch (e) {
      // we can't make this game possible.
      this.ebus.publish(
        new RoomImpossibleEvent(
          mode,
          parties.map(it => it.id),
        ),
      );
      return undefined;
    }
  }

  private async balanceRoom(
    parties: PartyInRoom[],
    mode: MatchmakingMode,
  ): Promise<RoomBalance> {
    const teamSize = Math.round(RoomSizes[mode] / 2);
    if (mode === MatchmakingMode.RANKED)
      return this.balanceService.rankedBalance(teamSize, parties);


    if(mode === MatchmakingMode.BOTS)
      return this.balanceService.botsBalance(teamSize, parties)

    // todo
    else return this.soloMidBalance(teamSize, parties);
  }

  private async soloMidBalance(
    teamSize: number,
    parties: PartyInRoom[],
  ): Promise<RoomBalance> {
    // todo: another balance.
    return this.balanceService.soloMidBalance(teamSize, parties);
  }
}
