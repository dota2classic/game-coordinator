import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { QueueProviders } from 'src/mm/queue';

@Module({
  imports: [CqrsModule],
  providers: [
    ...QueueProviders
  ],
})
export class MmModule {}
