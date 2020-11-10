export class AcceptPartyInviteCommand {
  constructor(public readonly inviteId: string, public readonly accept: boolean) {}
}
