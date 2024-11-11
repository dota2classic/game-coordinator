import {PlayerId} from "gateway/gateway/shared-types/player-id";
import {EventBus} from "@nestjs/cqrs";
import { inspect } from "util";
import Mock = jest.Mock;

export const randomUser = () => {
  return user(`${Math.round(Math.random() * 1000000)}`);
};

export const user1 = new PlayerId("1062901073");
export const user2 = new PlayerId("116514945");

export const user = (id: string) => new PlayerId(id);

export function printCalls(bus: EventBus) {
  const p = bus.publish as Mock;
  console.log(inspect(p.mock.calls));
}
