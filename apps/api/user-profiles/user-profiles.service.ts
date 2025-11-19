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

    // Remove fields that don't exist in the schema - be very explicit
    const {
      selectedPlan,
      planBillingCycle,
      planId,
      billingCycle,
      preferences,
      ...validProfileData
    } = profileData;

    // Ensure selectedPlan and planBillingCycle are completely removed
    delete (validProfileData as any).selectedPlan;
    delete (validProfileData as any).planBillingCycle;
    delete (validProfileData as any).planId;
    delete (validProfileData as any).billingCycle;

    const mergedPreferences = this.mergePreferences(
      preferences,
      selectedPlan || planId,
      planBillingCycle || billingCycle,
    );

    if (mergedPreferences) {
      validProfileData.preferences = mergedPreferences;
    }

    // Calculate daily calories if not provided
    if (!validProfileData.dailyCalories && validProfileData.height && validProfileData.weight && validProfileData.age && validProfileData.gender && validProfileData.activityLevel) {
      validProfileData.dailyCalories = this.calculateDailyCalories(validProfileData);
    }

    // Final safety check - remove any remaining invalid fields
    const finalData: any = {
      userId,
      ...validProfileData,
    };
    delete finalData.selectedPlan;
    delete finalData.planBillingCycle;
    delete finalData.planId;
    delete finalData.billingCycle;

    return this.prisma.userProfile.create({
      data: finalData,
    });
  }

  async getProfile(userId: string) {
    const profile = await this.prisma.userProfile.findUnique({
      where: { userId },
    });

    // Return null if profile doesn't exist (frontend will handle onboarding)
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

    // Remove fields that should not be updated directly or don't exist in schema
    const {
      id,
      userId: _userId,
      createdAt,
      updatedAt,
      email,
      selectedPlan,
      planBillingCycle,
      planId,
      billingCycle,
      preferences,
      ...updateData
    } = profileData;

    // Ensure selectedPlan and planBillingCycle are completely removed
    delete (updateData as any).selectedPlan;
    delete (updateData as any).planBillingCycle;
    delete (updateData as any).planId;
    delete (updateData as any).billingCycle;

    const mergedPreferences = this.mergePreferences(
      preferences ?? existingProfile.preferences,
      selectedPlan || planId,
      planBillingCycle || billingCycle,
    );

    if (mergedPreferences) {
      updateData.preferences = mergedPreferences;
    }

    // Final safety check - remove any remaining invalid fields
    const finalData: any = { ...updateData };
    delete finalData.selectedPlan;
    delete finalData.planBillingCycle;
    delete finalData.planId;
    delete finalData.billingCycle;

    return this.prisma.userProfile.update({
      where: { userId },
      data: finalData,
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

  private mergePreferences(
    basePreferences: any,
    selectedPlan?: string,
    planBillingCycle?: string,
  ) {
    const hasPlanSelection = selectedPlan || planBillingCycle;
    const preferencesClone = basePreferences
      ? { ...basePreferences }
      : hasPlanSelection
        ? {}
        : null;

    if (!preferencesClone) {
      return null;
    }

    if (hasPlanSelection) {
      const subscription = {
        ...(preferencesClone.subscription ?? {}),
      };

      if (selectedPlan) {
        subscription.planId = selectedPlan;
      }
      if (planBillingCycle) {
        subscription.billingCycle = planBillingCycle;
      } else if (selectedPlan === 'free' && !subscription.billingCycle) {
        subscription.billingCycle = 'lifetime';
      }

      preferencesClone.subscription = subscription;
    }

    return preferencesClone;
  }
}
