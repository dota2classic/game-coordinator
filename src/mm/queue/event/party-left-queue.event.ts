import { PlayerId } from "../../../gateway/gateway/shared-types/player-id";

export class PartyLeftQueueEvent {
  constructor(
    public readonly partyId: string,
    public readonly players: PlayerId[],
  ) {}
}
