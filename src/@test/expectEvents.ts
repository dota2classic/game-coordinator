import { CommandBus, EventBus, ICommand, IEvent } from "@nestjs/cqrs";

export function expectEvents(bus: EventBus){


  return (...events: IEvent[]) => {


    for(let e of events){
      expect(bus.publish).toBeCalledWith(e);
    }


    expect(bus.publish).toBeCalledTimes(events.length);
  }
}


export const commandHandlerTest = (ebus: EventBus, cbus: CommandBus) => {
  return async (command: ICommand, events: IEvent[]) => {
    await cbus.execute(command);
    expectEvents(ebus)(...events)
  }
}