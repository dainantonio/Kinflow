import { taskAgent } from '../../agents/taskAgent';
import { mealAgent } from '../../agents/mealAgent';
import { scheduleAgent } from '../../agents/scheduleAgent';
import { conversationAgent } from '../../agents/conversationAgent';
import { createAutomationProcedures } from './automationProcedures';

const AGENTS = {
  task: taskAgent,
  meal: mealAgent,
  schedule: scheduleAgent,
  conversation: conversationAgent,
};

const defaultPreferences = {
  task: { autoAssign: false, reminderSensitivity: 'balanced' },
  meal: { maxPrepMinutes: 35, optimizeForPantry: true },
  schedule: { preferredSlotMinutes: 60, avoidLateEvening: true },
  conversation: { concise: true },
};

export const createAgentProcedures = () => {
  const suggestions = new Map();
  const feedbackStore = [];
  const preferences = { ...defaultPreferences };
  const automation = createAutomationProcedures();

  return {
    async executeAgent(input = {}) {
      const agentName = input.agent || 'task';
      const handler = AGENTS[agentName] || AGENTS.task;
      const result = handler.execute(input.payload || {}, input.context || {});
      result.suggestions.forEach((suggestion) => {
        suggestions.set(suggestion.id, {
          ...suggestion,
          agent: agentName,
          status: 'proposed',
          createdAt: Date.now(),
        });
      });
      return result;
    },

    async approveSuggestion(input = {}) {
      const existing = suggestions.get(input.suggestionId);
      if (!existing) {
        return { ok: false, error: 'Suggestion not found' };
      }
      const updated = {
        ...existing,
        status: input.approved ? 'approved' : 'rejected',
        approvedBy: input.userId || 'system',
        reviewedAt: Date.now(),
      };
      suggestions.set(input.suggestionId, updated);
      return { ok: true, suggestion: updated };
    },

    async provideFeedback(input = {}) {
      const record = {
        id: `${Date.now()}-${feedbackStore.length}`,
        suggestionId: input.suggestionId || null,
        rating: input.rating ?? null,
        feedback: input.feedback || '',
        userId: input.userId || 'anonymous',
        createdAt: Date.now(),
      };
      feedbackStore.push(record);
      return { ok: true, feedback: record };
    },

    async getAgentPreferences(input = {}) {
      const agentName = input.agent || 'task';
      return {
        agent: agentName,
        preferences: preferences[agentName] || {},
      };
    },

    async updateAgentPreferences(input = {}) {
      const agentName = input.agent || 'task';
      preferences[agentName] = {
        ...(preferences[agentName] || {}),
        ...(input.preferences || {}),
      };
      return {
        agent: agentName,
        preferences: preferences[agentName],
      };
    },

    ...automation,
  };
};
