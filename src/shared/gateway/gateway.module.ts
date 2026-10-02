import { Module } from '@nestjs/common';
import { GatewayService } from './gateway.service';

@Module({
  imports: [],
  providers: [GatewayService],
  exports: [GatewayService],
})
export class GatewayModule {}
