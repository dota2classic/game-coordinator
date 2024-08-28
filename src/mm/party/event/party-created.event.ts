import { PartyId } from "gateway/gateway/shared-types/party-id";
import { PlayerId } from "gateway/gateway/shared-types/player-id";

export class PartyCreatedEvent {
  constructor(
    public readonly partyId: PartyId,
    public readonly leaderId: PlayerId,
    public readonly players: PlayerId[],
  ) {}
}
