import {Controller} from "@nestjs/common";
import {MessagePattern} from "@nestjs/microservices";
import {QueryBus} from "@nestjs/cqrs";
import {construct} from "src/gateway/gateway/util/construct";
import {GetQueueStateQuery} from "./gateway/queries/QueueState/get-queue-state.query";
import {GetQueueStateQueryResult} from "src/gateway/gateway/queries/QueueState/get-queue-state-query.result";
import {GetUserRoomQuery} from "./gateway/queries/GetUserRoom/get-user-room.query";
import {GetUserQueueQueryResult} from "src/gateway/gateway/queries/GetUserQueue/get-user-queue-query.result";
import {GetUserQueueQuery} from "./gateway/queries/GetUserQueue/get-user-queue.query";
import {GetPartyQueryResult} from "src/gateway/gateway/queries/GetParty/get-party-query.result";
import { GetPartyQuery } from "./gateway/queries/GetParty/get-party.query";

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
  async GetPartyQuery(
    query: GetPartyQuery,
  ): Promise<GetPartyQueryResult> {
    return this.qbus.execute(construct(GetPartyQuery, query));
  }
}
