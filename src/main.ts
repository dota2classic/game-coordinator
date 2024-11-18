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
import { Logger } from "@nestjs/common";
import { AppModule } from "app.module";
import { REDIS_HOST, REDIS_PASSWORD } from "@shared/env";
import { PartyInvitationModel } from "mm/party/model/party-invitation.model";
import { inspect } from "util";
import { GameFoundEvent } from "./mm/queue/event/game-found.event";
import { RoomReadyEvent } from "./gateway/gateway/events/room-ready.event";
import { RoomReadyCheckCompleteEvent } from "./gateway/gateway/events/room-ready-check-complete.event";
import { RoomReadyCheckTimeoutEvent } from "./mm/room/event/room-ready-check-timeout.event";
import { ReadyStateUpdatedEvent } from "./gateway/gateway/events/ready-state-updated.event";

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

  const qbus = app.get(QueryBus);
  const ebus = app.get(EventBus);
  const cbus = app.get(CommandBus);

  const elogger = new Logger("EventLogger");
  const clogger = new Logger("CommandLogger");
  const qlogger = new Logger("QueryBus");

  ebus
    .pipe(
      ofType<any, any>(
        GameFoundEvent,
        RoomReadyEvent,
        RoomReadyCheckCompleteEvent,
        RoomReadyCheckTimeoutEvent,
        ReadyStateUpdatedEvent,
      ),
    )
    .subscribe((e) => {
      if (e.constructor.name) qlogger.log(`${inspect(e)}`);
    });
  //

  // ebus.pipe(ofType<{}, {}>(GameFoundEvent, RoomReadyEvent))._subscribe(
  //   new Subscriber<any>(e => {
  //     elogger.log(
  //       `${inspect(e)}`,
  //       // e.__proto__.constructor.name,
  //     );
  //   }),
  // );

  // cbus._subscribe(
  //   new Subscriber<any>(e => {
  //     clogger.log(
  //       `${inspect(e)}`,
  //       // e.__proto__.constructor.name,
  //     );
  //   }),
  // );

  await app.listen();
  // console.log(`Started matchmaking core`);

  const publisher = app.get(EventPublisher);
  prepareModels(publisher);

  ebus.publish(new StartEvent());
}
bootstrap();
