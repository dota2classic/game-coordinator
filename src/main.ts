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
import { MatchmakingMode } from "src/gateway/shared-types/matchmaking-mode";

export function prepareModels(publisher: EventPublisher) {
  publisher.mergeClassContext(QueueModel);
  publisher.mergeClassContext(PartyModel);
  publisher.mergeClassContext(PlayerModel);
}

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.TCP,
      options: { retryAttempts: 5, retryDelay: 3000, port: 5000 },
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

  const publisher = app.get(EventPublisher);
  prepareModels(publisher);

  ebus.publish(new StartEvent());

  setTimeout(() => {
    cbus.execute(
      new EnterQueueCommand(
        "party1",
        [new PlayerInQueueEntity("pid", 1000)],
        MatchmakingMode.UNRANKED,
      ),
    );
  }, 1000);
}
bootstrap();
