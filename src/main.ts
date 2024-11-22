import { NestFactory } from "@nestjs/core";
import { EventBus, EventPublisher } from "@nestjs/cqrs";
import { QueueModel } from "mm/queue/model/queue.model";
import { PartyModel } from "./mm/party/model/party.model";
import { PlayerModel } from "./mm/player/model/player.model";
import { Transport } from "@nestjs/microservices";
import { StartEvent } from "mm/start.event";
import { AppModule } from "app.module";
import { PartyInvitationModel } from "mm/party/model/party-invitation.model";
import { WinstonWrapper } from "./util/logger";
import { ConfigService } from "@nestjs/config";
import { RedisOptions } from "@nestjs/microservices/interfaces/microservice-configuration.interface";

export function prepareModels(publisher: EventPublisher) {
  publisher.mergeClassContext(QueueModel);
  publisher.mergeClassContext(PartyModel);
  publisher.mergeClassContext(PartyInvitationModel);
  publisher.mergeClassContext(PlayerModel);
}

async function bootstrap() {

  // const app = await NestFactory.createApplicationContext(AppModule, {
  //   logger: new WinstonWrapper(),
  // });
  //
  //
  // // This ugly mess is waiting for NestJS ^11
  // const config: ConfigService = app.get(ConfigService);
  //
  // const microservice = await NestFactory.createMicroservice<RedisOptions>(AppModule,{
  //   transport: Transport.REDIS,
  //   options: {
  //     retryAttempts: Infinity,
  //     retryDelay: 3000,
  //     password: config.get("redis.password"),
  //     host: config.get("redis.host"),
  //   },
  // });
  //
  // const publisher = app.get(EventPublisher);
  // prepareModels(publisher);
  //
  // await microservice.listen()
  //
  // await app.get(EventBus).publish(new StartEvent());
  //
  //
  // await app.close();
}
bootstrap();
