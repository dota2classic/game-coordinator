import { EventPattern } from "@nestjs/microservices";
import { construct } from "gateway/gateway/util/construct";
import { Controller } from "@nestjs/common";
import { EventBus } from "@nestjs/cqrs";
import { PartyInviteRequestedEvent } from "gateway/gateway/events/party/party-invite-requested.event";

@Controller()
export class PartyController {
  constructor(private readonly ebus: EventBus) {}

  @EventPattern(PartyInviteRequestedEvent.name)
  async PartyInviteRequestedEvent(cmd: PartyInviteRequestedEvent) {
    await this.ebus.publish(construct(PartyInviteRequestedEvent, cmd));
  }
}
