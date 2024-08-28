import { EventsHandler, IEventHandler } from "@nestjs/cqrs";
import { RoomReadyEvent } from "gateway/gateway/events/room-ready.event";
import { RoomRepository } from "mm/room/repository/room.repository";

@EventsHandler(RoomReadyEvent)
export class RoomReadyHandler implements IEventHandler<RoomReadyEvent> {
  constructor(private readonly rRep: RoomRepository) {}

  async handle(event: RoomReadyEvent) {
    await this.rRep.delete(event.roomId);
  }
}
