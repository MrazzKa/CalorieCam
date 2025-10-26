export interface AnalyticsEvent {
  name: string;
  properties?: Record<string, any>;
  timestamp?: Date;
}

export interface AnalyticsAdapter {
  track(event: AnalyticsEvent): void;
  trackScreenView(screenName: string, properties?: Record<string, any>): void;
  trackUserAction(action: string, properties?: Record<string, any>): void;
  trackError(error: string, properties?: Record<string, any>): void;
  setUserProperties(properties: Record<string, any>): void;
  setUserId(userId: string): void;
}

export class ConsoleAnalyticsAdapter implements AnalyticsAdapter {
  private userId?: string;
  private userProperties: Record<string, any> = {};

  track(event: AnalyticsEvent): void {
    console.log('Analytics Event:', {
      ...event,
      userId: this.userId,
      userProperties: this.userProperties,
      timestamp: event.timestamp || new Date(),
    });
  }

  trackScreenView(screenName: string, properties?: Record<string, any>): void {
    this.track({
      name: 'screen_view',
      properties: {
        screen_name: screenName,
        ...properties,
      },
    });
  }

  trackUserAction(action: string, properties?: Record<string, any>): void {
    this.track({
      name: 'user_action',
      properties: {
        action,
        ...properties,
      },
    });
  }

  trackError(error: string, properties?: Record<string, any>): void {
    this.track({
      name: 'error',
      properties: {
        error,
        ...properties,
      },
    });
  }

  setUserProperties(properties: Record<string, any>): void {
    this.userProperties = { ...this.userProperties, ...properties };
  }

  setUserId(userId: string): void {
    this.userId = userId;
  }
}

export const analyticsAdapter = new ConsoleAnalyticsAdapter();
