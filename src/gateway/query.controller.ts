import { Controller } from "@nestjs/common";
import { MessagePattern } from "@nestjs/microservices";
import { QueryBus } from "@nestjs/cqrs";
import { construct } from "gateway/gateway/util/construct";
import { GetQueueStateQuery } from "./gateway/queries/QueueState/get-queue-state.query";
import { GetQueueStateQueryResult } from "gateway/gateway/queries/QueueState/get-queue-state-query.result";
import { GetUserRoomQuery } from "./gateway/queries/GetUserRoom/get-user-room.query";
import { GetUserQueueQueryResult } from "gateway/gateway/queries/GetUserQueue/get-user-queue-query.result";
import { GetUserQueueQuery } from "./gateway/queries/GetUserQueue/get-user-queue.query";
import { GetPartyQueryResult } from "gateway/gateway/queries/GetParty/get-party-query.result";
import { GetPartyQuery } from "./gateway/queries/GetParty/get-party.query";
import { GetPartyInvitationsQueryResult } from "./gateway/queries/GetPartyInvitations/get-party-invitations-query.result";
import { GetPartyInvitationsQuery } from "./gateway/queries/GetPartyInvitations/get-party-invitations.query";

@Controller()
export class QueryController {
  constructor(private readonly qbus: QueryBus) {}

  @MessagePattern(GetQueueStateQuery.name)
  async QueueStateQuery(
    query: GetQueueStateQuery,
  ): Promise<GetQueueStateQueryResult> {
    return this.qbus.execute(construct(GetQueueStateQuery, query));
  }

  @MessagePattern(GetUserRoomQuery.name)
  async GetUserRoomQuery(
    query: GetUserRoomQuery,
  ): Promise<GetQueueStateQueryResult> {
    return this.qbus.execute(construct(GetUserRoomQuery, query));
  }

  @MessagePattern(GetUserQueueQuery.name)
  async GetUserQueueQuery(
    query: GetUserQueueQuery,
  ): Promise<GetUserQueueQueryResult> {
    return this.qbus.execute(construct(GetUserQueueQuery, query));
  }

  @MessagePattern(GetPartyQuery.name)
  async GetPartyQuery(query: GetPartyQuery): Promise<GetPartyQueryResult> {
    return this.qbus.execute(construct(GetPartyQuery, query));
  }

  @MessagePattern(GetPartyInvitationsQuery.name)
  async GetPartyInvitations(
    query: GetPartyInvitationsQuery,
  ): Promise<GetPartyInvitationsQueryResult> {
    return this.qbus.execute(construct(GetPartyInvitationsQuery, query));
  }
}
