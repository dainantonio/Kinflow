import { taskAgent } from './taskAgent';
import { mealAgent } from './mealAgent';
import { scheduleAgent } from './scheduleAgent';

const AGENT_HANDLERS = {
  task: taskAgent,
  meal: mealAgent,
  schedule: scheduleAgent,
};

const inferAgent = (text = '') => {
  const normalized = text.toLowerCase();
  if (/(meal|dinner|lunch|breakfast|ingredient|grocery)/.test(normalized)) return 'meal';
  if (/(schedule|calendar|free time|conflict|time slot)/.test(normalized)) return 'schedule';
  return 'task';
};

export const conversationAgent = {
  id: 'conversation',
  execute(input = {}, context = {}) {
    const message = input.message || input.prompt || '';
    const selectedAgent = input.agent || inferAgent(message);
    const handler = AGENT_HANDLERS[selectedAgent] || taskAgent;

    const agentResponse = handler.execute(
      {
        ...input,
        prompt: message,
      },
      context,
    );

    const preview = agentResponse.suggestions.slice(0, 2).map((item) => `• ${item.title}`).join('\n');

    return {
      agent: 'conversation',
      routedAgent: selectedAgent,
      summary: `${handler.title} analyzed your request.`,
      responseText: preview
        ? `I routed this to the ${handler.title}. Here are top suggestions:\n${preview}`
        : `I routed this to the ${handler.title}, but no actionable suggestions were generated yet.`,
      suggestions: agentResponse.suggestions,
      metadata: {
        routedAgent: selectedAgent,
        generatedAt: Date.now(),
      },
      context,
    };
  },
};
