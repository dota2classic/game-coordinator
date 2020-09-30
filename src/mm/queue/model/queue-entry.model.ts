import { PartyId } from "src/mm/party/model/party.model";
import { AggregateRoot } from "@nestjs/cqrs";
import { MatchmakingMode } from "src/mm/queue/model/entity/matchmaking-mode";

export type QueueEntryId = string;

export class QueueEntryModel extends AggregateRoot {
  public get id(): QueueEntryId {
    return `${this.mode}${this.partyID}`;
  }

  constructor(
    public readonly partyID: PartyId,
    public readonly mode: MatchmakingMode,
    public readonly size: number,
  ) {
    super();
  }
}
