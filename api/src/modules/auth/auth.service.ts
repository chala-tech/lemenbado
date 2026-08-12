import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../../lib/prisma';
import { env } from '../../lib/env';
import { HttpError } from '../../middleware/errorHandler';

const SALT_ROUNDS = 10;

interface RegisterInput {
  phone: string;
  password: string;
  name: string;
  role: 'TRUCK_OWNER' | 'CARGO_OWNER';
}


function signToken(userId: string, role: string, name: string) {
  const options: jwt.SignOptions = { expiresIn: env.jwtExpiresIn as jwt.SignOptions['expiresIn'] };
  return jwt.sign({ userId, role, name }, env.jwtSecret, options);
}

function toPublicUser(user: { id: string; name: string; phone: string; role: string }) {
  return { id: user.id, name: user.name, phone: user.phone, role: user.role };
}

export async function register(input: RegisterInput) {
  const existing = await prisma.user.findUnique({ where: { phone: input.phone } });
  if (existing) throw new HttpError(409, 'An account with this phone number already exists');

  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);

  const user = await prisma.user.create({
    data: { phone: input.phone, passwordHash, name: input.name, role: input.role },
  });

  return { token: signToken(user.id, user.role, user.name), user: toPublicUser(user) };
}

export async function login(phone: string, password: string) {
  const user = await prisma.user.findUnique({ where: { phone } });
  if (!user) throw new HttpError(401, 'Invalid phone number or password');

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw new HttpError(401, 'Invalid phone number or password');

  return { token: signToken(user.id, user.role, user.name), user: toPublicUser(user) };
}

export async function getUserById(id: string) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new HttpError(404, 'User not found');
  return toPublicUser(user);
}