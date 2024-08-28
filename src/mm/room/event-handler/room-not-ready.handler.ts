import { EventBus, EventsHandler, IEventHandler } from "@nestjs/cqrs";
import { RoomNotReadyEvent } from "gateway/gateway/events/room-not-ready.event";
import { RoomRepository } from "mm/room/repository/room.repository";
import { BadRoomFinalizedEvent } from "mm/room/event/bad-room-finalized.event";

@EventsHandler(RoomNotReadyEvent)
export class RoomNotReadyHandler implements IEventHandler<RoomNotReadyEvent> {
  constructor(
    private readonly roomRep: RoomRepository,
    private readonly ebus: EventBus,
  ) {}

  async handle(event: RoomNotReadyEvent) {
    const room = await this.roomRep.get(event.roomId);
    if (!room) return;
    const goodParties = room.getAcceptedParties();
    this.ebus.publish(new BadRoomFinalizedEvent(goodParties));

    await this.roomRep.delete(event.roomId);
  }
}
