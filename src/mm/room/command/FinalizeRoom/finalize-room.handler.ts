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
import { TeamEntry } from "../../model/entity/room-balance";

@CommandHandler(FinalizeRoomCommand)
export class FinalizeRoomHandler
  implements ICommandHandler<FinalizeRoomCommand>
{
  private readonly logger = new Logger(FinalizeRoomHandler.name);

  constructor(
    private readonly ebus: EventBus,
    private readonly roomRepository: RoomRepository,
  ) {}

  private static createTeam(team: TeamEntry, dt: DotaTeam): MatchPlayer[] {
    return team.parties.flatMap((qem) =>
      qem.players.map((t) => new MatchPlayer(t.playerId, dt, qem.partyID)),
    );
  }

  async execute(command: FinalizeRoomCommand) {
    const room = await this.roomRepository.get(command.roomId);
    if (!room) throw "No room";
    // ok here we basically publish event of room-ready

    if (command.state.accepted === command.state.total) {
      const shuffledTeams =
        Math.random() > 0.5
          ? [room.balance.teams[1], room.balance.teams[0]]
          : room.balance.teams;

      const radiant = FinalizeRoomHandler.createTeam(
        shuffledTeams[0],
        DotaTeam.RADIANT,
      );
      const dire = FinalizeRoomHandler.createTeam(
        shuffledTeams[1],
        DotaTeam.DIRE,
      );

      this.logger.log("Room ready", {
        mode: room.mode,
        version: room.version,
        room_id: room.id,
        players: [...radiant, ...dire],
      });

      this.ebus.publish(
        new RoomReadyEvent(
          command.roomId,
          room.mode,
          [...radiant, ...dire],
          room.version,
        ),
      );
    } else {
      this.logger.log("Room not ready", {
        room_id: room.id,
        players: room.players.map((t) => t.playerId),
        mode: room.mode,
        version: room.version,
      });
      this.ebus.publish(
        new RoomNotReadyEvent(
          room.id,
          room.players.map((t) => t.playerId),
        ),
      );
    }
  }
}
