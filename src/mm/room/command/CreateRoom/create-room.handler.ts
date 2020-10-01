import { CommandHandler, EventBus, ICommandHandler } from "@nestjs/cqrs";
import { Logger } from "@nestjs/common";
import {
  CreateRoomCommand,
  PartyInRoom,
} from "src/mm/room/command/CreateRoom/create-room.command";
import { RoomModel } from "src/mm/room/model/room.model";
import { RoomEntry } from "src/mm/room/model/room-entry";
import { RoomRepository } from "src/mm/room/repository/room.repository";
import { RoomCreatedEvent } from "src/mm/room/event/room-created.event";
import { MatchmakingMode } from "src/mm/queue/model/entity/matchmaking-mode";
import { RoomBalance, TeamEntry } from "src/mm/room/model/entity/room-balance";
import { RoomSizes } from "src/mm/room/model/entity/room-size";
import { RuntimeException } from "@nestjs/core/errors/exceptions/runtime.exception";
import { RoomImpossibleEvent } from "src/mm/room/event/room-impossible.event";

@CommandHandler(CreateRoomCommand)
export class CreateRoomHandler implements ICommandHandler<CreateRoomCommand> {
  private readonly logger = new Logger(CreateRoomHandler.name);

  constructor(
    private readonly roomRepository: RoomRepository,
    private readonly ebus: EventBus,
  ) {}

  async execute({ parties, mode }: CreateRoomCommand) {
    try {
      const balance = await this.balanceRoom(parties, mode);

      const room = new RoomModel(
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
      return this.rankedBalance(teamSize, parties);
    else return this.unrankedBalance(teamSize, parties);
  }

  private async unrankedBalance(
    teamSize: number,
    parties: PartyInRoom[],
  ): Promise<RoomBalance> {
    // todo: another balance.
    return this.rankedBalance(teamSize, parties);
  }

  private async rankedBalance(
    teamSize: number,
    parties: PartyInRoom[],
  ): Promise<RoomBalance> {
    let radiantMMR = 0;
    let direMMR = 0;

    const radiantParties: PartyInRoom[] = [];
    const direParties: PartyInRoom[] = [];

    let radiantPlayerCount = 0;
    let direPlayerCount = 0;

    parties.forEach(it => {
      if (
        // if radiant less mmr and
        (radiantMMR <= direMMR && radiantPlayerCount < teamSize) ||
        direPlayerCount === teamSize
      ) {
        radiantParties.push(it);
        radiantPlayerCount += it.players.length;
        radiantMMR += it.totalMMR;
      } else if (
        (direMMR <= radiantMMR && direPlayerCount < teamSize) ||
        radiantPlayerCount === teamSize
      ) {
        direParties.push(it);
        direPlayerCount += it.players.length;
        direMMR += it.totalMMR;
      } else if (radiantPlayerCount < teamSize) {
        radiantParties.push(it);
        radiantPlayerCount += it.players.length;
        radiantMMR += it.totalMMR;
      } else if (direPlayerCount < teamSize) {
        direParties.push(it);
        direPlayerCount += it.players.length;
        direMMR += it.totalMMR;
      }
    });

    if (radiantPlayerCount !== teamSize || direPlayerCount !== teamSize) {
      throw new RuntimeException(
        "Can't balance this game. It needs to be cancelled",
      );
    }

    return new RoomBalance(
      [radiantParties, direParties].map(list => new TeamEntry(list)),
    );
  }
}
