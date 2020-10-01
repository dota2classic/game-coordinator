import { PartyId } from "src/gateway/gateway/shared-types/party-id";
import { PlayerId } from "src/gateway/gateway/shared-types/player-id";

export class PartyCreatedEvent {
  constructor(
    public readonly partyId: PartyId,
    public readonly leaderId: PlayerId,
  ) {}
}
