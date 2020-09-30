import { Module } from '@nestjs/common';
import { MmModule } from './mm/mm.module';


@Module({
  imports: [MmModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
