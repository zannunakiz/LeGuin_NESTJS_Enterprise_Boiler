import { UserEntity } from '@/api/user/entities/user.entity';
import { Uuid } from '@/common/types/common.type';
import { CreatorModel } from '@/database/models/creator.model';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';

@Entity('session')
export class SessionEntity extends CreatorModel {
  @Column({
    type: 'varchar',
    length: 255,
  })
  hash: string;

  @Index({ where: '"deletedAt" IS NULL' })
  @Column()
  userId: Uuid;

  @JoinColumn({
    name: 'userId',
  })
  @ManyToOne(() => UserEntity, { onDelete: 'SET NULL' })
  user: UserEntity;
}
