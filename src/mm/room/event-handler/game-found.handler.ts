import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { GameFoundEvent } from 'src/mm/queue/event/game-found.event';

@EventsHandler(GameFoundEvent)
export class GameFoundHandler implements IEventHandler<GameFoundEvent> {
  constructor() {}

  async handle({ mode, parties }: GameFoundEvent) {



  }
}
