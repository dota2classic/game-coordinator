import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { CommandBus, EventBus, EventPublisher } from '@nestjs/cqrs';
import { QueueModel } from 'src/mm/queue/model/queue.model';
import { Subscriber } from 'rxjs';
import { Logger } from '@nestjs/common';
import { StartEvent } from 'src/mm/general/event/start.event';

function prepareModels(publisher: EventPublisher) {
  publisher.mergeClassContext(QueueModel);
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const ebus = app.get(EventBus);
  const cbus = app.get(CommandBus);

  const clogger = new Logger('CommandLogger');
  const elogger = new Logger('EventLogger');

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


  await app.listen(3000);


  const publisher = app.get(EventPublisher);
  prepareModels(publisher);

  ebus.publish(new StartEvent());
}
bootstrap();
