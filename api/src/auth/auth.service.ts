import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcryptjs';
import { AuthUser } from '../common/auth-user';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async login(username: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { username: username.trim() },
      include: { unit: true },
    });
    const matches = user ? await bcrypt.compare(password, user.password) : false;
    if (!user || !matches) {
      throw new UnauthorizedException('Invalid username or password');
    }
    if (!user.active) {
      throw new UnauthorizedException('This account is disabled');
    }
    const profile = this.toProfile(user);
    return {
      accessToken: await this.jwt.signAsync({
        sub: profile.id,
        username: profile.username,
        role: profile.role,
        name: profile.name,
      }),
      user: profile,
    };
  }

  async profile(userId: string): Promise<AuthUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { unit: true },
    });
    if (!user) throw new UnauthorizedException();
    return this.toProfile(user);
  }

  private toProfile(user: { id: string; username: string; name: string; role: string; unit: { callsign: string } | null }): AuthUser {
    return {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      callsign: user.unit?.callsign ?? null,
    };
  }
}
