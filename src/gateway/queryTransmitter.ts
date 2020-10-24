import {IQueryHandler, QueryHandler} from "@nestjs/cqrs";
import {ClientProxy} from "@nestjs/microservices";

// @ts-ignore
export function queryTransmitter(type: any): any {

  @QueryHandler(type)
  class A implements IQueryHandler<any> {
    constructor(private readonly redis: ClientProxy) {
    }

    execute(query: any): Promise<any> {
      return this.redis.send<any>(type.name.name, query).toPromise();
    }
  }

  return {
    provide: A,
    useFactory(core: ClientProxy) {
      return new A(core);
    },
    inject: ["RedisQueue"],
  };
}