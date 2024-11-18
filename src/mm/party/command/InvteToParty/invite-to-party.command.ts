import { PlayerId } from "gateway/gateway/shared-types/player-id";

export class InviteToPartyCommand {
  constructor(
    public readonly playerId: PlayerId,
    public readonly toInvite: PlayerId,
  ) {}
}
