import {PartyId} from "src/gateway/gateway/shared-types/party-id";
import {RoomEntry} from "src/mm/room/model/room-entry";
import {QueueEntryModel} from "src/mm/queue/model/queue-entry.model";

export class BadRoomFinalizedEvent {
  constructor(public readonly goodParties: QueueEntryModel[]) {
  }
}
