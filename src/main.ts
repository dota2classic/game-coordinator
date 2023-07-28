import {NestFactory} from "@nestjs/core";
import {CommandBus, EventBus, EventPublisher, QueryBus} from "@nestjs/cqrs";
import {QueueModel} from "./mm/queue/model/queue.model";
import {PartyModel} from "./mm/party/model/party.model";
import {PlayerModel} from "./mm/player/model/player.model";
import {MicroserviceOptions, Transport} from "@nestjs/microservices";
import {StartEvent} from "src/mm/start.event";
import {Logger} from "@nestjs/common";
import {AppModule} from "src/app.module";
import {REDIS_PASSWORD, REDIS_URL} from "src/@shared/env";
import {PartyInvitationModel} from "src/mm/party/model/party-invitation.model";
import {GetPlayerInfoQuery} from "src/gateway/gateway/queries/GetPlayerInfo/get-player-info.query";
import {PlayerId} from "src/gateway/gateway/shared-types/player-id";
import {Dota2Version} from "src/gateway/gateway/shared-types/dota2version";
import {LogEvent} from "src/gateway/gateway/events/log.event";
import {Subscriber} from "rxjs";
import {inspect} from "util";

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
        url: REDIS_URL(),
      },
    },
  );

  const qbus = app.get(QueryBus);
  const ebus = app.get(EventBus);
  const cbus = app.get(CommandBus);

  const elogger = new Logger("EventLogger");
  const clogger = new Logger("CommandLogger");
  const qlogger = new Logger("QueryBus");

  // ebus._subscribe(
  //   new Subscriber<any>(e => {
  //     qlogger.log(
  //       `${inspect(e)}`,
  //       // e.__proto__.constructor.name,
  //     );
  //   }),
  // );
  // //

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

  await app.listenAsync();
  // console.log(`Started matchmaking core`);

  const publisher = app.get(EventPublisher);
  prepareModels(publisher);

  ebus.publish(new StartEvent());


  await ebus.publish(new LogEvent("hello"))

}
bootstrap();


