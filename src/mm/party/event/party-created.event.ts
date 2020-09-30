import { PartyId } from "src/mm/party/model/party.model";
import { PlayerId } from "src/mm/player/model/player.model";

export class PartyCreatedEvent {
  constructor(public readonly partyId: PartyId, public readonly leaderId: PlayerId) {
  }
}