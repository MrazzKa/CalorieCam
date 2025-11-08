export type FlowStepType = 'question' | 'summary';

export interface FlowStep {
  id: string;
  type: FlowStepType;
  prompt: string;
  description?: string;
  quickReplies?: string[];
  expectedField?: string;
  validation?: (value: string) => string | null;
  next?: string;
}

export interface FlowDefinition {
  id: string;
  title: string;
  description: string;
  summaryTemplate: (collected: Record<string, any>) => string;
  steps: FlowStep[];
}

export interface FlowState {
  sessionId: string;
  flowId: string;
  userId: string;
  stepId: string;
  collected: Record<string, any>;
  startedAt: string;
  updatedAt: string;
}

export interface FlowResponse {
  flowId: string;
  sessionId: string;
  step: FlowStep;
  collected: Record<string, any>;
  summary?: string;
  complete: boolean;
  suggestions?: string[];
}
