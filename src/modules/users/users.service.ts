import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatarUrl: true,
        createdAt: true,
        candidateProfile: true,
        _count: {
          select: {
            cvs: true,
            jobs: true,
            notifications: { where: { isRead: false } },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const { name, ...profileData } = dto;

    if (name) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { name },
      });
    }

    const updatedProfile = await this.prisma.candidateProfile.upsert({
      where: { userId },
      update: {
        ...profileData,
      },
      create: {
        userId,
        headline: profileData.headline || 'Candidate',
        bio: profileData.bio,
        skills: profileData.skills || [],
        targetRoles: profileData.targetRoles || [],
        preferredLocations: profileData.preferredLocations || [],
        workModePreferences: profileData.workModePreferences || [],
        minExpectedSalary: profileData.minExpectedSalary,
        targetSalary: profileData.targetSalary,
        currency: profileData.currency || 'USD',
        noticePeriodDays: profileData.noticePeriodDays || 30,
        portfolioUrl: profileData.portfolioUrl,
        linkedinUrl: profileData.linkedinUrl,
        githubUrl: profileData.githubUrl,
      },
    });

    return this.getProfile(userId);
  }
}
