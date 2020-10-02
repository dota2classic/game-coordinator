import { NestFactory } from "@nestjs/core";
import { CommandBus, EventBus, EventPublisher } from "@nestjs/cqrs";
import { QueueModel } from "./mm/queue/model/queue.model";
import { PartyModel } from "./mm/party/model/party.model";
import { PlayerModel } from "./mm/player/model/player.model";
import { MicroserviceOptions, Transport } from "@nestjs/microservices";
import { Subscriber } from "rxjs";
import { StartEvent } from "src/mm/start.event";
import { Logger } from "@nestjs/common";
import { AppModule } from "src/app.module";
import { EnterQueueCommand } from "src/mm/queue/command/EnterQueue/enter-queue.command";
import { PlayerInQueueEntity } from "src/mm/queue/model/entity/player-in-queue.entity";
import { MatchmakingMode } from "src/gateway/gateway/shared-types/matchmaking-mode";
import { REDIS_URL } from "src/@shared/env";
import { LeaveQueueCommand } from "src/mm/queue/command/LeaveQueue/leave-queue.command";
import { wait } from "src/@shared/wait";

export function prepareModels(publisher: EventPublisher) {
  publisher.mergeClassContext(QueueModel);
  publisher.mergeClassContext(PartyModel);
  publisher.mergeClassContext(PlayerModel);
}

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.REDIS,
      options: {
        retryAttempts: 5,
        retryDelay: 3000,
        url: REDIS_URL(),
      },
    },
  );

  const ebus = app.get(EventBus);
  const cbus = app.get(CommandBus);

  const clogger = new Logger("CommandLogger");
  const elogger = new Logger("EventLogger");

  ebus._subscribe(
    new Subscriber<any>(e => {
      elogger.log(
        // `${inspect(e)}`,
        e.__proto__.constructor.name,
      );
    }),
  );

  cbus._subscribe(
    new Subscriber<any>(e => {
      clogger.log(
        // `${inspect(e)}`,
        e.__proto__.constructor.name,
      );
    }),
  );

  await app.listenAsync();
  console.log(`Started matchmaking core`);

  const publisher = app.get(EventPublisher);
  prepareModels(publisher);

  ebus.publish(new StartEvent());
}
bootstrap();
