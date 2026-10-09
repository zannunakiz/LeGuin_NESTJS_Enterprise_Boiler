import { IVerifyEmailJob } from '@/common/interfaces/job.interface';
import { Branded } from '@/common/types/types';
import { GlobalConfig } from '@/config/config.type';
import { CacheKey } from '@/constants/cache.constant';
import { JobName, QueueName } from '@/constants/job.constant';
import { I18nTranslations } from '@/generated/i18n.generated';
import { CacheService } from '@/shared/cache/cache.service';
import { verifyPassword } from '@/utils/password/password.util';
import { InjectQueue } from '@nestjs/bullmq';
import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { randomStringGenerator } from '@nestjs/common/utils/random-string-generator.util';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Queue } from 'bullmq';
import { plainToInstance } from 'class-transformer';
import crypto from 'crypto';
import ms from 'ms';
import { I18nService } from 'nestjs-i18n';
import { Repository } from 'typeorm';
import { UserEntity } from '../user/entities/user.entity';
import { Role } from '../user/user.enum';
import { LoginReqDto } from './dto/login.req.dto';
import { LoginResDto } from './dto/login.res.dto';
import { RefreshReqDto } from './dto/refresh.req.dto';
import { RefreshResDto } from './dto/refresh.res.dto';
import { RegisterReqDto } from './dto/register.req.dto';
import { RegisterResDto } from './dto/register.res.dto';
import { SessionEntity } from './entities/session.entity';
import { JwtPayloadType } from './types/jwt-payload.type';
import { JwtRefreshPayloadType } from './types/jwt-refresh-payload.type';

type Token = Branded<
  {
    accessToken: string;
    refreshToken: string;
    tokenExpires: number;
  },
  'token'
>;

@Injectable()
export class AuthService {
  constructor(
    private readonly i18nService: I18nService<I18nTranslations>,
    private readonly configService: ConfigService<GlobalConfig>,
    private readonly jwtService: JwtService,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(SessionEntity)
    private readonly sessionRepository: Repository<SessionEntity>,
    @InjectQueue(QueueName.EMAIL)
    private readonly emailQueue: Queue<IVerifyEmailJob, any, string>,
    private readonly cacheService: CacheService,
  ) {}

  async login(dto: LoginReqDto): Promise<LoginResDto> {
    const { email, password } = dto;
    const user = await this.userRepository.findOne({
      where: { email },
      select: ['id', 'email', 'password'],
    });

    const isPasswordValid =
      user && (await verifyPassword(password, user.password));

    if (!isPasswordValid) {
      throw new UnauthorizedException();
    }

    const hash = crypto
      .createHash('sha256')
      .update(randomStringGenerator())
      .digest('hex');

    const session = this.sessionRepository.create({
      hash,
      userId: user.id,
      createdByUserId: user.id,
      updatedByUserId: user.id,
    });
    await session.save();

    const token = await this._createToken({
      id: user.id,
      sessionId: session.id,
      hash,
      role: user?.role,
    });

    return plainToInstance(LoginResDto, {
      userId: user.id,
      ...token,
    });
  }

  async register(dto: RegisterReqDto): Promise<RegisterResDto> {
    const userExists = await this.userRepository.exists({
      where: { email: dto.email },
    });

    if (userExists) {
      throw new ConflictException(
        this.i18nService.t('user.sameUsernameOrEmailAlreadyExists'),
      );
    }

    const user = this.userRepository.create({
      username: dto.username,
      email: dto.email,
      password: dto.password,
    });

    await user.save({ transaction: false });

    const token = await this._createVerificationToken({ id: user.id });
    const tokenExpiresIn = this.configService.getOrThrow(
      'auth.confirmEmailExpires',
      {
        infer: true,
      },
    );
    await this.cacheService.set(
      { key: CacheKey.EMAIL_VERIFICATION, args: [user.id] },
      token,
      { ttl: +tokenExpiresIn },
    );
    await this.emailQueue.add(JobName.EMAIL_VERIFICATION, {
      email: dto.email,
      token,
    });

    return plainToInstance(RegisterResDto, {
      userId: user.id,
    });
  }

  async logout(userToken: JwtPayloadType): Promise<void> {
    await this.cacheService.storeSet<boolean>(
      { key: CacheKey.SESSION_BLACKLIST, args: [userToken.sessionId] },
      true,
      { ttl: userToken.exp * 1000 - Date.now() },
    );
    await SessionEntity.delete(userToken.sessionId);
  }

  async refreshToken(dto: RefreshReqDto): Promise<RefreshResDto> {
    const { sessionId, hash } = this._verifyRefreshToken(dto.refreshToken);
    const session = await SessionEntity.findOneBy({ id: sessionId });

    if (!session || session.hash !== hash) {
      throw new UnauthorizedException();
    }

    const user = await this.userRepository.findOne({
      where: { id: session.userId },
      select: ['id'],
    });

    if (!user) {
      throw new NotFoundException(this.i18nService.t('user.notFound'));
    }

    const newHash = crypto
      .createHash('sha256')
      .update(randomStringGenerator())
      .digest('hex');

    SessionEntity.update(session.id, { hash: newHash });

    return await this._createToken({
      id: user.id,
      sessionId: session.id,
      hash: newHash,
      role: user?.role,
    });
  }

  async verifyAccessToken(token: string): Promise<JwtPayloadType> {
    let payload: JwtPayloadType;
    try {
      payload = this.jwtService.verify(token, {
        secret: this.configService.getOrThrow('auth.secret', { infer: true }),
      });
    } catch {
      throw new UnauthorizedException();
    }

    const isSessionBlacklisted = await this.cacheService.storeGet<boolean>({
      key: CacheKey.SESSION_BLACKLIST,
      args: [payload.sessionId],
    });

    if (isSessionBlacklisted) {
      throw new UnauthorizedException();
    }

    return payload;
  }

  private _verifyRefreshToken(token: string): JwtRefreshPayloadType {
    try {
      return this.jwtService.verify(token, {
        secret: this.configService.getOrThrow('auth.refreshSecret', {
          infer: true,
        }),
      });
    } catch {
      throw new UnauthorizedException();
    }
  }

  private async _createVerificationToken(data: {
    id: string;
  }): Promise<string> {
    return await this.jwtService.signAsync(
      {
        id: data.id,
      },
      {
        secret: this.configService.getOrThrow('auth.confirmEmailSecret', {
          infer: true,
        }),
        expiresIn: this.configService.getOrThrow('auth.confirmEmailExpires', {
          infer: true,
        }),
      },
    );
  }

  private async _createToken(data: {
    id: string;
    sessionId: string;
    hash: string;
    role: Role;
  }): Promise<Token> {
    const tokenExpiresIn = this.configService.getOrThrow('auth.expires', {
      infer: true,
    });
    const tokenExpires = Date.now() + ms(tokenExpiresIn);

    const [accessToken, refreshToken] = await Promise.all([
      await this.jwtService.signAsync(
        {
          id: data.id,
          role: data?.role,
          sessionId: data.sessionId,
        },
        {
          secret: this.configService.getOrThrow('auth.secret', { infer: true }),
          expiresIn: tokenExpiresIn,
        },
      ),
      await this.jwtService.signAsync(
        {
          sessionId: data.sessionId,
          hash: data.hash,
        },
        {
          secret: this.configService.getOrThrow('auth.refreshSecret', {
            infer: true,
          }),
          expiresIn: this.configService.getOrThrow('auth.refreshExpires', {
            infer: true,
          }),
        },
      ),
    ]);
    return {
      accessToken,
      refreshToken,
      tokenExpires,
    } as Token;
  }
}
