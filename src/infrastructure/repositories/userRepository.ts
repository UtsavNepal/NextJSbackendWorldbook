import { PrismaClient } from '@/generated/prisma';
const prisma = new PrismaClient();

export const userRepository = {
  async getUserById(id: string) {
    return prisma.user.findUnique({ where: { id }, select: { id: true, email: true, firstname: true, lastname: true, birthday: true, gender: true, emailActive: true, profilePicture: true, isActive: true, isStaff: true, isVerified: true, otp: true, joinedAt: true, password: true } });
  },
  async getUserByEmail(email: string) {
    return prisma.user.findUnique({ where: { email }, select: { id: true, email: true, firstname: true, lastname: true, birthday: true, gender: true, emailActive: true, profilePicture: true, isActive: true, isStaff: true, isVerified: true, otp: true, joinedAt: true, password: true } });
  },
  async createUser(data: {
    email: string;
    firstname?: string;
    lastname?: string;
    birthday?: Date;
    gender?: string;
    profilePicture?: string;
    emailActive?: boolean;
    isActive?: boolean;
    isStaff?: boolean;
    isVerified?: boolean;
    otp?: string;
    joinedAt?: Date;
    password: string;
  }) {
    return prisma.user.create({ data });
  },
  async listUsers() {
    return prisma.user.findMany({ select: { id: true, email: true, firstname: true, lastname: true, birthday: true, gender: true, emailActive: true, profilePicture: true, isActive: true, isStaff: true, isVerified: true, otp: true, joinedAt: true, password: true } });
  },
  async updateUser(id: string, data: any) {
    return prisma.user.update({ where: { id }, data });
  },
  async deleteUser(id: string) {
    return prisma.user.delete({ where: { id } });
  },
  // Add more methods as needed
}; 