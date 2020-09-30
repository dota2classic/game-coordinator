import { RuntimeRepository } from 'src/@shared/runtime-repository';

export function clearRepositories() {
  // @ts-ignore
  RuntimeRepository.clearAll();
}
