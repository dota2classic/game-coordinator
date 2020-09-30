import { AggregateRoot } from '@nestjs/cqrs';


export type PlayerId = string;
export class PlayerModel extends AggregateRoot {
  constructor(public readonly steamID: PlayerId) {
    super();
  }
}