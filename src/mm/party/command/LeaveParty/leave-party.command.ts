import { PlayerId } from 'src/gateway/gateway/shared-types/player-id';

export class LeavePartyCommand {
  constructor(public readonly playerId: PlayerId) {
  }
}