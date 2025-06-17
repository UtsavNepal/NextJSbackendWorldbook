import { userRepository } from '../infrastructure/repositories/userRepository';
import { User } from '../domain/user';

function mapUser(prismaUser: any): User | null {
  if (!prismaUser) return null;
  return {
    id: prismaUser.id,
    firstname: prismaUser.firstname,
    lastname: prismaUser.lastname,
    birthday: prismaUser.birthday,
    gender: prismaUser.gender,
    email: prismaUser.email,
    emailActive: prismaUser.emailActive,
    profilePicture: prismaUser.profilePicture,
    isActive: prismaUser.isActive,
    isStaff: prismaUser.isStaff,
    isVerified: prismaUser.isVerified,
    otp: prismaUser.otp,
    joinedAt: prismaUser.joinedAt,
    password: prismaUser.password,
  };
}

export const userService = {
  async getUserById(id: string): Promise<User | null> {
    const user = await userRepository.getUserById(id);
    return mapUser(user);
  },
  async createUser(user: Omit<User, 'id'>): Promise<User> {
    const created = await userRepository.createUser({
      email: user.email,
      firstname: user.firstname ?? undefined,
      lastname: user.lastname ?? undefined,
      birthday: user.birthday ?? undefined,
      gender: user.gender ?? undefined,
      profilePicture: user.profilePicture ?? undefined,
      otp: user.otp ?? undefined,
      joinedAt: user.joinedAt ?? undefined,
      emailActive: user.emailActive,
      isActive: user.isActive,
      isStaff: user.isStaff,
      isVerified: user.isVerified,
      password: user.password,
    });
    return mapUser(created)!;
  },
  async listUsers(): Promise<User[]> {
    const users = await userRepository.listUsers();
    return users.map(mapUser).filter(Boolean) as User[];
  },
  async updateUser(id: string, data: Partial<User>): Promise<User | null> {
    const updated = await userRepository.updateUser(id, data);
    return mapUser(updated);
  },
  async deleteUser(id: string): Promise<void> {
    await userRepository.deleteUser(id);
  },
  async searchUsers(query: string) {
    return userRepository.searchUsers(query);
  },
}; 