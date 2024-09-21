import { CommandHandler, EventBus, ICommandHandler } from "@nestjs/cqrs";
import { Logger } from "@nestjs/common";
import { FinalizeRoomCommand } from "mm/room/command/FinalizeRoom/finalize-room.command";
import {
  MatchPlayer,
  RoomReadyEvent,
} from "gateway/gateway/events/room-ready.event";
import { RoomRepository } from "mm/room/repository/room.repository";
import { RoomNotReadyEvent } from "gateway/gateway/events/room-not-ready.event";
import { DotaTeam } from "../../../../gateway/gateway/shared-types/dota-team";

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

    if (command.state.accepted === command.state.total) {
      const radiant: MatchPlayer[] = room.balance.teams[0].parties.flatMap(t =>
        t.players.map(t => ({
          playerId: t.playerId,
          team: DotaTeam.RADIANT,
          name: "",
        })),
      );
      const dire = room.balance.teams[1].parties.flatMap(t =>
        t.players.map(t => ({
          playerId: t.playerId,
          team: DotaTeam.DIRE,
          name: "",
        })),
      );
      this.ebus.publish(
        new RoomReadyEvent(
          command.roomId,
          command.mode,
          [...radiant, ...dire],
          room.balance.averageMMR,
          room.version,
        ),
      );
    } else {
      this.ebus.publish(
        new RoomNotReadyEvent(
          room.id,
          room.players.map(t => t.playerId),
        ),
      );
    }
  }
}
