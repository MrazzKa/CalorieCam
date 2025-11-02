import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class UserProfilesService {
  constructor(private readonly prisma: PrismaService) {}

  async createProfile(userId: string, profileData: any) {
    // Check if profile already exists
    const existingProfile = await this.prisma.userProfile.findUnique({
      where: { userId },
    });

    if (existingProfile) {
      throw new BadRequestException('Profile already exists');
    }

    // Calculate daily calories if not provided
    if (!profileData.dailyCalories && profileData.height && profileData.weight && profileData.age && profileData.gender && profileData.activityLevel) {
      profileData.dailyCalories = this.calculateDailyCalories(profileData);
    }

    return this.prisma.userProfile.create({
      data: {
        userId,
        ...profileData,
      },
    });
  }

  async getProfile(userId: string) {
    const profile = await this.prisma.userProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    return profile;
  }

  async updateProfile(userId: string, profileData: any) {
    const existingProfile = await this.prisma.userProfile.findUnique({
      where: { userId },
    });

    if (!existingProfile) {
      throw new NotFoundException('Profile not found');
    }

    // Recalculate daily calories if relevant fields changed
    if (profileData.height || profileData.weight || profileData.age || profileData.gender || profileData.activityLevel) {
      const updatedData = { ...existingProfile, ...profileData };
      profileData.dailyCalories = this.calculateDailyCalories(updatedData);
    }

    // Remove fields that should not be updated directly
    const { id, userId: _userId, createdAt, updatedAt, email, ...updateData } = profileData;

    return this.prisma.userProfile.update({
      where: { userId },
      data: updateData,
    });
  }

  async completeOnboarding(userId: string) {
    return this.prisma.userProfile.update({
      where: { userId },
      data: { isOnboardingCompleted: true },
    });
  }

  private calculateDailyCalories(profile: any): number {
    const { height, weight, age, gender, activityLevel } = profile;
    
    if (!height || !weight || !age || !gender || !activityLevel) {
      return 2000; // Default value
    }

    // Calculate BMR using Mifflin-St Jeor Equation
    let bmr;
    if (gender === 'male') {
      bmr = 10 * weight + 6.25 * height - 5 * age + 5;
    } else {
      bmr = 10 * weight + 6.25 * height - 5 * age - 161;
    }

    // Apply activity level multiplier
    const activityMultipliers = {
      sedentary: 1.2,
      lightly_active: 1.375,
      moderately_active: 1.55,
      very_active: 1.725,
      extremely_active: 1.9,
    };

    const multiplier = activityMultipliers[activityLevel] || 1.2;
    return Math.round(bmr * multiplier);
  }
}
