import { PartyId } from "src/gateway/shared-types/party-id";
import { PlayerId } from "src/gateway/shared-types/player-id";

export class PartyCreatedEvent {
  constructor(
    public readonly partyId: PartyId,
    public readonly leaderId: PlayerId,
  ) {}
}
