import { NestFactory } from "@nestjs/core";
import { EventBus, EventPublisher } from "@nestjs/cqrs";
import { Transport } from "@nestjs/microservices";
import { StartEvent } from "mm/start.event";
import { AppModule } from "app.module";
import { WinstonWrapper } from "./util/logger";
import { ConfigService } from "@nestjs/config";
import { RedisOptions } from "@nestjs/microservices/interfaces/microservice-configuration.interface";
import configuration from "./config/configuration";
import { prepareModels } from "./prepareModels";
import { Logger } from "@nestjs/common";

async function bootstrap() {
  // This ugly mess is waiting for NestJS ^11
  const config = new ConfigService(configuration());
  // console.log(config)


  const app = await NestFactory.createMicroservice<RedisOptions>(AppModule, {
    logger: new WinstonWrapper(
      config.get("fluentbit.host"),
      config.get("fluentbit.port"),
      config.get<boolean>("fluentbit.disabled"),
    ),
    transport: Transport.REDIS,
    options: {
      retryAttempts: Infinity,
      retryDelay: 3000,
      password: config.get("redis.password"),
      host: config.get("redis.host"),
    },
  });



  const elogger = new Logger(EventBus.name);

  app.get(EventBus).subscribe(event => elogger.log(event.constructor.name, event))

  await app.listen();


  const publisher = app.get(EventPublisher);
  prepareModels(publisher);

  await app.get(EventBus).publish(new StartEvent());
}

bootstrap();
