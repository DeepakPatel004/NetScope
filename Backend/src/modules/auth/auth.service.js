import prisma from '../../config/database.js';
import { hashPassword, comparePassword } from '../../utils/hash.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../utils/jwt.js';

export const authService = {
  async register({ username, email, password, fullName }) {
    try {
      const passwordHash = await hashPassword(password);
      const user = await prisma.user.create({
        data: { username, email, passwordHash, fullName }
      });
      return user;
    } catch (error) {
      if (error?.code === 'P2002') {
        const target = Array.isArray(error.meta?.target) ? error.meta.target.join(', ') : error.meta?.target;
        if (target?.includes('username')) {
          throw new Error('That username is already in use. Please choose another.');
        }
        if (target?.includes('email')) {
          throw new Error('That email is already registered. Please sign in or use another email.');
        }
      }
      throw error;
    }
  },

  async login({ email, password }) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new Error('Invalid credentials');

    const ok = await comparePassword(password, user.passwordHash);
    if (!ok) throw new Error('Invalid credentials');

    const accessToken = signAccessToken({ sub: user.id, role: user.role });
    const refreshToken = signRefreshToken({ sub: user.id });

    // persist refresh token
    await prisma.refreshToken.create({ data: { token: refreshToken, userId: user.id, expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30) } });

    return { accessToken, refreshToken, user: { id: user.id, email: user.email, username: user.username } };
  },

  async logout(refreshToken) {
    if (!refreshToken) return;
    await prisma.refreshToken.updateMany({ where: { token: refreshToken }, data: { revoked: true } });
  },

  async refreshToken(refreshToken) {
    if (!refreshToken) throw new Error('No refresh token provided');

    // verify token signature
    const payload = verifyRefreshToken(refreshToken);
    const stored = await prisma.refreshToken.findUnique({ where: { token: refreshToken } });
    if (!stored || stored.revoked) throw new Error('Invalid refresh token');

    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) throw new Error('User not found');

    const accessToken = signAccessToken({ sub: user.id, role: user.role });
    const newRefreshToken = signRefreshToken({ sub: user.id });

    // revoke old and save new
    await prisma.refreshToken.updateMany({ where: { token: refreshToken }, data: { revoked: true } });
    await prisma.refreshToken.create({ data: { token: newRefreshToken, userId: user.id, expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30) } });

    return { accessToken, refreshToken: newRefreshToken };
  },

  async getProfile(userId) {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, username: true, email: true, fullName: true, createdAt: true, role: true } });
    return user;
  },

  async changePassword(userId, oldPassword, newPassword) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found');
    const ok = await comparePassword(oldPassword, user.passwordHash);
    if (!ok) throw new Error('Old password incorrect');
    const newHash = await hashPassword(newPassword);
    await prisma.user.update({ where: { id: userId }, data: { passwordHash: newHash } });
  }
};
