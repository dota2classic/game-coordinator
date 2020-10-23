import { EventsHandler, IEventHandler } from "@nestjs/cqrs";
import { RoomNotReadyEvent } from "src/gateway/gateway/events/room-not-ready.event";
import { RoomRepository } from "src/mm/room/repository/room.repository";

@EventsHandler(RoomNotReadyEvent)
export class RoomNotReadyHandler implements IEventHandler<RoomNotReadyEvent> {
  constructor(private readonly roomRep: RoomRepository) {}

  async handle(event: RoomNotReadyEvent) {
    await this.roomRep.delete(event.roomId);
  }
}
