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
import { ConfigModule, ConfigService } from "@nestjs/config";
import { RedisOptions } from "@nestjs/microservices/interfaces/microservice-configuration.interface";
import configuration from "./config/configuration";
import { Module } from "@nestjs/common";

export function prepareModels(publisher: EventPublisher) {
  publisher.mergeClassContext(QueueModel);
  publisher.mergeClassContext(PartyModel);
  publisher.mergeClassContext(PartyInvitationModel);
  publisher.mergeClassContext(PlayerModel);
}

async function bootstrap() {


  const tmp = new ConfigService(configuration())
  const app = await NestFactory.createMicroservice(
    AppModule,
    {
      transport: Transport.REDIS,
      options: {
        retryAttempts: Infinity,
        retryDelay: 3000,
        password: tmp.get('redis.password'),
        host: tmp.get('redis.host')
      },
    },
  );


  // This ugly mess is waiting for NestJS ^11
  const config: ConfigService = app.get(ConfigService);
  app.useLogger(new WinstonWrapper(config.get('fluentbit.host'), config.get<number>('fluentbit.port')))


  const publisher = app.get(EventPublisher);
  prepareModels(publisher);

  await app.listen()

  await app.get(EventBus).publish(new StartEvent());

}


// async function bootstrap() {
//
//   const app = await NestFactory.createMicroservice(
//     AppModule,
//     {
//       transport: Transport.REDIS,
//       options: {
//         retryAttempts: Infinity,
//         retryDelay: 3000,
//         password: 'test123',
//         host: 'localhost'
//       },
//     },
//   );
//
//
//   // This ugly mess is waiting for NestJS ^11
//   const config: ConfigService = app.get(ConfigService);
//   app.useLogger(new WinstonWrapper(config.get('fluentbit.host'), config.get<number>('fluentbit.port')))
//
//   // const microservice = await NestFactory.createMicroservice<RedisOptions>(AppModule,{
//   //   transport: Transport.REDIS,
//   //   options: {
//   //     retryAttempts: Infinity,
//   //     retryDelay: 3000,
//   //     password: config.get("redis.password"),
//   //     host: config.get("redis.host"),
//   //   },
//   // });
//
//   const publisher = app.get(EventPublisher);
//   prepareModels(publisher);
//
//   await app.listen()
//
//   await app.get(EventBus).publish(new StartEvent());
//
// }
bootstrap();
