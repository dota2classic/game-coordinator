import { IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import { Logger } from "@nestjs/common";
import { GetUserRoomQuery } from "gateway/gateway/queries/GetUserRoom/get-user-room.query";
import {
  GetUserRoomQueryResult,
  GetUserRoomQueryResultRoomInfo,
} from "gateway/gateway/queries/GetUserRoom/get-user-room-query.result";
import { RoomRepository } from "mm/room/repository/room.repository";
import { ReadyCheckEntry } from "../../../gateway/gateway/events/room-ready-check-complete.event";
import { PlayerId } from "../../../gateway/gateway/shared-types/player-id";

@QueryHandler(GetUserRoomQuery)
export class GetUserRoomHandler
  implements IQueryHandler<GetUserRoomQuery, GetUserRoomQueryResult> {
  private readonly logger = new Logger(GetUserRoomHandler.name);

  constructor(private readonly roomRep: RoomRepository) {}

  async execute(command: GetUserRoomQuery): Promise<GetUserRoomQueryResult> {
    const room = await this.roomRep.findWithPlayer(command.playerId);

    if (!room) return new GetUserRoomQueryResult(undefined);

    return new GetUserRoomQueryResult(
      new GetUserRoomQueryResultRoomInfo(
        command.playerId,
        room.id,
        room.mode,
        room.readyCheckState.accepted,
        room.readyCheckState.total,
        room.didAccept(command.playerId),
        room.getReadyCheckEntries()
      ),
    );
  }
}
