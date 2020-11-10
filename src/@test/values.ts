import { PlayerId } from "src/gateway/gateway/shared-types/player-id";

export const randomUser = () => {
  return user(`[U:1:${Math.round(Math.random() * 1000000)}]`);
};

export const user1 = new PlayerId("[U:1:1062901073]");
export const user2 = new PlayerId("[U:1:116514945]");

export const user = (id: string) => new PlayerId(id);
