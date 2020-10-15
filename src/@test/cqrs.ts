import {CommandBus, EventBus, EventPublisher, IEvent, ofType} from "@nestjs/cqrs";
import {Provider, Type} from "@nestjs/common";
import {RuntimeRepository} from "src/@shared/runtime-repository";

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

export function waitFor<T = any>(ebus: EventBus, event: Type<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      reject(`Event ${event.name} won't come :(`)
    }, 500)
    const unsub = ebus.pipe(ofType(event)).subscribe(e => {
      unsub.unsubscribe();
      resolve(e);
    });
  });
}

declare global {
  namespace jest {
    // noinspection JSUnusedGlobalSymbols
    interface Matchers<R> {
      toEmit(...events: IEvent[]): CustomMatcherResult;
      toEmitNothing(): CustomMatcherResult;
    }
  }
}
