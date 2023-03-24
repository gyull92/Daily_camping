import {
  ConflictException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserDto } from '../auth/dto/create-user.dto';
import { User } from '../entity/user.entity';
import { Article } from 'src/entity/article.entity';
import { Comment } from 'src/entity/comment.entity';
import * as bcrypt from 'bcryptjs';
import { ConfigService } from '@nestjs/config';
import { UserService } from 'src/user/user.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { Review } from 'src/entity/review.entity';
import { ArticleLike, CommentLike, PlaceLike } from 'src/entity/like.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Article)
    private readonly articleRepository: Repository<Article>,
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,
    @InjectRepository(Review)
    private readonly reviewRepository: Repository<Review>,
    @InjectRepository(ArticleLike)
    private readonly articlelikeRepository: Repository<ArticleLike>,
    @InjectRepository(CommentLike)
    private readonly commentlikeRepository: Repository<CommentLike>,
    @InjectRepository(PlaceLike)
    private readonly placelikeRepository: Repository<PlaceLike>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly userService: UserService,
  ) {}

  async isLoggined(req) {
    const userId = req.user.id;
    return await this.userRepository.findOne({ where: { id: userId }, select: ['id', 'nickname'] });
  }

  async validateUser(email: string, plainTextPassword: string) {
    try {
      const user = await this.userService.getByEmail(email);
      await this.userService.verifyPassword(plainTextPassword, user.password);
      return user;
    } catch (error) {
      throw new UnauthorizedException();
    }
  }

  async getinfo(req) {
    const userId = req.user.id;
    return await this.userRepository.findOne({
      where: { id: userId },
      select: ['id', 'name', 'nickname', 'phone', 'email', 'image'],
    });
  }

  async emailLogOff(req) {
    const userId = req.user.id;
    const user = await this.userRepository.findOne({ where: { id: userId }, select: ['id', 'email'] });
    const logoff = user.email + 'logoff';
    return await this.userRepository
      .createQueryBuilder()
      .update(User)
      .set({ email: () => `REPLACE(email, '${user.email}', '${logoff}')` })
      .where({ id: userId })
      .execute();
  }

  async remove(req) {
    const userId = req.user.id;
    await this.userRepository.findOne({ where: { id: userId } });
    await this.emailLogOff(req);
    await this.userService.removeRefreshToken(userId);
    return await this.userRepository.softDelete({ id: userId });
  }

  // 회원가입
  async signup(createUserDto: CreateUserDto) {
    const { email, name, password, phone, nickname } = createUserDto;

    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);
    const user = await this.userRepository.create({ email, name, password: hashedPassword, phone, nickname });

    const existedemail = await this.userRepository.findOneBy({ email });
    if (existedemail) {
      throw new ConflictException('이미 존재하는 이메일입니다.');
    }
    const existednickname = await this.userRepository.findOneBy({ nickname });
    if (existednickname) {
      throw new ConflictException('이미 존재하는 닉네임입니다.');
    }
    return await this.userRepository.save(user);
  }

  // Access Token 발급
  getCookieWithJwtAccessToken(id: number, nickname: string) {
    const payload = { id, nickname };
    const token = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_ACCESS_TOKEN_SECRET'),
      expiresIn: `${this.configService.get('JWT_ACCESS_TOKEN_EXPIRATION_TIME')}`,
    });

    return {
      accessToken: token,
      domain: this.configService.get('DATABASE_HOST'),
      path: '/',
      httpOnly: true,
      maxAge: 1000 * 60 * 60,
    };
  }

  // Refresh Token 발급
  getCookieWithJwtRefreshToken(id: number, nickname: string) {
    const payload = { id, nickname };
    const token = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_REFRESH_TOKEN_SECRET'),
      expiresIn: `${this.configService.get('JWT_REFRESH_TOKEN_EXPIRATION_TIME')}`,
    });

    return {
      refreshToken: token,
      domain: this.configService.get('DATABASE_HOST'),
      path: '/',
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 30,
    };
  }

  // 초기화된 쿠키의 옵션을 가져옴
  getCookiesForLogOut() {
    return {
      domain: this.configService.get('DATABASE_HOST'),
      path: '/',
      httpOnly: true,
      maxAge: 0,
    };
  }
}
