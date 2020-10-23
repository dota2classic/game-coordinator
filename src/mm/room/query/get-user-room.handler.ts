import { QueryHandler, IQueryHandler } from "@nestjs/cqrs";
import { Logger } from "@nestjs/common";
import { GetUserRoomQuery } from "src/gateway/gateway/queries/GetUserRoom/get-user-room.query";
import {
  GetUserRoomQueryResult,
  GetUserRoomQueryResultRoomInfo,
} from "src/gateway/gateway/queries/GetUserRoom/get-user-room-query.result";
import { RoomRepository } from "src/mm/room/repository/room.repository";

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
      ),
    );
  }
}
