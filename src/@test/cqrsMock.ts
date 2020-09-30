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
