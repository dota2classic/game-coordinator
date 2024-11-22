import { NestFactory } from "@nestjs/core";
import {
  CommandBus,
  EventBus,
  EventPublisher,
  ofType,
  QueryBus,
} from "@nestjs/cqrs";
import { QueueModel } from "mm/queue/model/queue.model";
import { PartyModel } from "./mm/party/model/party.model";
import { PlayerModel } from "./mm/player/model/player.model";
import { MicroserviceOptions, Transport } from "@nestjs/microservices";
import { StartEvent } from "mm/start.event";
import { AppModule } from "app.module";
import { REDIS_HOST, REDIS_PASSWORD } from "@shared/env";
import { PartyInvitationModel } from "mm/party/model/party-invitation.model";
import { WinstonWrapper } from "./util/logger";

export function prepareModels(publisher: EventPublisher) {
  publisher.mergeClassContext(QueueModel);
  publisher.mergeClassContext(PartyModel);
  publisher.mergeClassContext(PartyInvitationModel);
  publisher.mergeClassContext(PlayerModel);
}

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.REDIS,
      options: {
        retryAttempts: Infinity,
        retryDelay: 3000,
        password: REDIS_PASSWORD(),
        host: REDIS_HOST(),
      },
    },
  );

  app.useLogger(new WinstonWrapper());

  const qbus = app.get(QueryBus);
  const ebus = app.get(EventBus);
  const cbus = app.get(CommandBus);


  await app.listen();

  const publisher = app.get(EventPublisher);
  prepareModels(publisher);

  ebus.publish(new StartEvent());
}
bootstrap();
