import { EventPublisher } from "@nestjs/cqrs";
import { QueueModel } from "./mm/queue/model/queue.model";
import { PartyModel } from "./mm/party/model/party.model";
import { PartyInvitationModel } from "./mm/party/model/party-invitation.model";
import { PlayerModel } from "./mm/player/model/player.model";

export function prepareModels(publisher: EventPublisher) {
  publisher.mergeClassContext(QueueModel);
  publisher.mergeClassContext(PartyModel);
  publisher.mergeClassContext(PartyInvitationModel);
  publisher.mergeClassContext(PlayerModel);
}
