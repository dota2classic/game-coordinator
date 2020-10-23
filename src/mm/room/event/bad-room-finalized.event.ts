import {PartyId} from "src/gateway/gateway/shared-types/party-id";
import {RoomEntry} from "src/mm/room/model/room-entry";

export class BadRoomFinalizedEvent {
  constructor(public readonly goodParties: RoomEntry[]) {
  }
}