import { Module } from '@nestjs/common';
import { CacheModule } from '../cache/cache.module';
import { GatewayService } from './gateway.service';

@Module({
  imports: [CacheModule],
  providers: [GatewayService],
  exports: [GatewayService],
})
export class GatewayModule {}
