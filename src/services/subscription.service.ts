import { prisma } from './database.service';
import { SubscriptionType, SubscriptionStatus, BillingCycle } from '@prisma/client';

export interface CreateSubscriptionData {
  userId: string;
  type: SubscriptionType;
  status?: SubscriptionStatus;
  billingCycle?: BillingCycle;
  price?: number;
  currency?: string;
  paymentMethod?: string;
  startDate?: Date;
  endDate?: Date;
  trialEndDate?: Date;
}

/**
 * Get user's current active subscription
 */
export const getCurrentSubscription = async (userId: string) => {
  return await prisma.subscription.findFirst({
    where: {
      userId,
      isActive: true,
      OR: [
        {
          status: 'ACTIVE',
          endDate: {
            gt: new Date()
          }
        },
        {
          status: 'TRIAL',
          trialEndDate: {
            gt: new Date()
          }
        }
      ]
    },
    orderBy: {
      createdAt: 'desc'
    }
  });
};

/**
 * Get user's subscription history
 */
export const getSubscriptionHistory = async (userId: string) => {
  return await prisma.subscription.findMany({
    where: {
      userId
    },
    orderBy: {
      createdAt: 'desc'
    }
  });
};

/**
 * Create a new subscription for user
 */
export const createSubscription = async (data: CreateSubscriptionData) => {
  // Deactivate existing subscriptions
  await prisma.subscription.updateMany({
    where: {
      userId: data.userId,
      isActive: true
    },
    data: {
      isActive: false,
      status: 'CANCELLED',
      updatedAt: new Date()
    }
  });

  // Create new subscription
  const subscriptionData: any = {
    userId: data.userId,
    type: data.type,
    status: data.status || 'ACTIVE',
    startDate: data.startDate || new Date(),
    isActive: true
  };

  if (data.billingCycle) {
    subscriptionData.billingCycle = data.billingCycle;
  }

  if (data.price) {
    subscriptionData.price = data.price;
  }

  if (data.currency) {
    subscriptionData.currency = data.currency;
  } else {
    subscriptionData.currency = 'PLN';
  }

  if (data.paymentMethod) {
    subscriptionData.paymentMethod = data.paymentMethod;
  }

  if (data.endDate) {
    subscriptionData.endDate = data.endDate;
  }

  if (data.trialEndDate) {
    subscriptionData.trialEndDate = data.trialEndDate;
  }

  return await prisma.subscription.create({
    data: subscriptionData
  });
};

/**
 * Update subscription status
 */
export const updateSubscriptionStatus = async (
  subscriptionId: string, 
  status: SubscriptionStatus,
  endDate?: Date
) => {
  const updateData: any = {
    status,
    updatedAt: new Date()
  };

  if (endDate !== undefined) {
    updateData.endDate = endDate;
  }

  return await prisma.subscription.update({
    where: {
      id: subscriptionId
    },
    data: updateData
  });
};

/**
 * Cancel subscription
 */
export const cancelSubscription = async (userId: string) => {
  return await prisma.subscription.updateMany({
    where: {
      userId,
      isActive: true
    },
    data: {
      status: 'CANCELLED',
      isActive: false,
      updatedAt: new Date()
    }
  });
};

/**
 * Check if user has active subscription
 */
export const hasActiveSubscription = async (userId: string): Promise<boolean> => {
  const subscription = await getCurrentSubscription(userId);
  return !!subscription;
};

/**
 * Get user's current subscription type
 */
export const getUserSubscriptionType = async (userId: string): Promise<SubscriptionType> => {
  const subscription = await getCurrentSubscription(userId);
  return subscription?.type || 'FREE';
};

/**
 * Create default FREE subscription for new user
 */
export const createDefaultSubscription = async (userId: string) => {
  return await prisma.subscription.create({
    data: {
      userId,
      type: 'FREE',
      status: 'ACTIVE',
      isActive: true,
      startDate: new Date()
    }
  });
};

/**
 * Extend subscription (for renewals)
 */
export const extendSubscription = async (
  subscriptionId: string,
  additionalDays: number
) => {
  const subscription = await prisma.subscription.findUnique({
    where: { id: subscriptionId }
  });

  if (!subscription) {
    throw new Error('Subscription not found');
  }

  const currentEndDate = subscription.endDate || new Date();
  const newEndDate = new Date(currentEndDate.getTime() + (additionalDays * 24 * 60 * 60 * 1000));

  return await prisma.subscription.update({
    where: { id: subscriptionId },
    data: {
      endDate: newEndDate,
      status: 'ACTIVE',
      updatedAt: new Date()
    }
  });
};

/**
 * Start trial subscription
 */
export const startTrialSubscription = async (
  userId: string,
  type: SubscriptionType,
  trialDays: number = 14
) => {
  const trialEndDate = new Date();
  trialEndDate.setDate(trialEndDate.getDate() + trialDays);

  return await createSubscription({
    userId,
    type,
    status: 'TRIAL',
    trialEndDate
  });
};

/**
 * Get subscription stats for admin
 */
export const getSubscriptionStats = async () => {
  const stats = await prisma.subscription.groupBy({
    by: ['type', 'status'],
    where: {
      isActive: true
    },
    _count: true
  });

  return stats;
};
