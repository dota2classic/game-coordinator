import {PlayerId} from 'gateway/gateway/shared-types/player-id';

export class LeavePartyCommand {
  constructor(public readonly playerId: PlayerId) {
  }
}
