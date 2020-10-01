import { CommandBus, EventBus, EventPublisher } from "@nestjs/cqrs";
import { Provider } from "@nestjs/common";

const ebusProvider: Provider = {
  provide: EventBus,
  useFactory: () => ({
    publish: jest.fn(),
  }),
};

const TestEventBus = () => ebusProvider;

const TestCommandBus = () => ({
  provide: CommandBus,
  useClass: CommandBus,
});

export const TestEnvironment = () => [
  TestEventBus(),
  TestCommandBus(),
  EventPublisher,
];



export function clearRepositories() {
  // @ts-ignore
  RuntimeRepository.clearAll();
}


import { IEvent } from "@nestjs/cqrs";
import { RuntimeRepository } from "src/@shared/runtime-repository";
declare global {
  namespace jest {
    // noinspection JSUnusedGlobalSymbols
    interface Matchers<R> {
      toEmit(...events: IEvent[]): CustomMatcherResult;
      toEmitNothing(): CustomMatcherResult;
    }
  }
}