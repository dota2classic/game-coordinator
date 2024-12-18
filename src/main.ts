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

async function bootstrap() {
  // This ugly mess is waiting for NestJS ^11
  const config = new ConfigService(configuration());

  const app = await NestFactory.createMicroservice<RedisOptions>(AppModule, {
    logger: new WinstonWrapper(
      config.get("fluentbit.host"),
      config.get<number>("fluentbit.port"),
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

  await app.listen();

  const publisher = app.get(EventPublisher);
  prepareModels(publisher);

  await app.get(EventBus).publish(new StartEvent());
}

bootstrap();
