import { IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import { Logger } from "@nestjs/common";
import { GetPartyQuery } from "gateway/gateway/queries/GetParty/get-party.query";
import { GetPartyQueryResult } from "gateway/gateway/queries/GetParty/get-party-query.result";
import { PartyRepository } from "mm/party/repository/party.repository";

@QueryHandler(GetPartyQuery)
export class GetPartyHandler
  implements IQueryHandler<GetPartyQuery, GetPartyQueryResult> {
  private readonly logger = new Logger(GetPartyHandler.name);

  constructor(private readonly partyRepository: PartyRepository) {}

  // @cached(10, GetPartyQuery.name)
  async execute(command: GetPartyQuery): Promise<GetPartyQueryResult> {
    const p = await this.partyRepository.getPartyOf(command.id);
    return new GetPartyQueryResult(p.id, p.leader, p.players);
  }
}
