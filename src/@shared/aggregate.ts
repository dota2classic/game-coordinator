// this stuff annotates class to automatically create command handler later

import {Type} from "@nestjs/common";

export const AggregateRootTarget = <B, T>(entity: Type<B>) => (
  constructor: Type<T>,
) => {
  console.log("Annotated class", constructor.name);
};

export const AggregateId: PropertyDecorator = <T>(t: object, key: string) => {

};
