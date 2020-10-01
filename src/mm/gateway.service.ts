import { Inject, Injectable, OnApplicationBootstrap } from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import { EventBus } from "@nestjs/cqrs";

@Injectable()
export class GatewayService implements OnApplicationBootstrap {
  constructor(
    @Inject("DiscordGateway") private readonly clientProxy: ClientProxy,
    private readonly ebus: EventBus,
  ) {}

  async onApplicationBootstrap() {
    await this.clientProxy.connect();
    this.ebus.subscribe(t => {
      this.clientProxy.emit(t.constructor.name, t);
    });
  }
}
