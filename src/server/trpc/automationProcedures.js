import { mealAgent } from '../../agents/mealAgent';
import { scheduleAgent } from '../../agents/scheduleAgent';

const DAY_MS = 24 * 60 * 60 * 1000;

const buildWeekSlots = (weekMeals = []) => {
  const slots = [];
  weekMeals.forEach((day) => {
    (day.slots || []).forEach((slot) => {
      slots.push({ day: day.day, slot: slot.name, meal: slot.meal || null });
    });
  });
  return slots;
};

const scorePhotoEvidence = (photo = {}) => {
  const baseScore = Number(photo.qualityScore ?? 0.78);
  const brightnessBoost = Number(photo.brightness ?? 0.5) * 0.08;
  const blurPenalty = Number(photo.blur ?? 0.2) * 0.1;
  const score = Math.max(0.5, Math.min(0.99, Number((baseScore + brightnessBoost - blurPenalty).toFixed(2))));
  return {
    score,
    verdict: score >= 0.8 ? 'Looks good' : 'Needs review',
  };
};

const sameDay = (left, right) => {
  const l = new Date(left);
  const r = new Date(right);
  return l.getFullYear() === r.getFullYear() && l.getMonth() === r.getMonth() && l.getDate() === r.getDate();
};

const within24Hours = (left, right) => Math.abs(new Date(left).getTime() - new Date(right).getTime()) <= DAY_MS;

const listMissingIngredients = (mealSuggestions = [], pantry = []) => {
  const pantryTerms = new Set(pantry.map((item) => String(item.name || item).toLowerCase()));
  const needed = new Set();
  mealSuggestions.forEach((suggestion) => {
    (suggestion.payload?.missingIngredients || []).forEach((ingredient) => {
      const term = String(ingredient).toLowerCase();
      if (!pantryTerms.has(term)) needed.add(ingredient);
    });
  });
  return [...needed];
};

const timestampId = (prefix) => `${prefix}-${Date.now()}-${Math.round(Math.random() * 1000)}`;

export const createAutomationProcedures = () => {
  const kinflowAgentSuggestions = [];
  const notifications = [];
  const toasts = [];

  const persistSuggestion = (trigger, suggestion, metadata = {}) => {
    const record = {
      id: suggestion.id || timestampId(trigger),
      trigger,
      ...suggestion,
      status: 'proposed',
      collection: 'kinflow_agent_suggestions',
      metadata,
      createdAt: Date.now(),
    };
    kinflowAgentSuggestions.push(record);
    return record;
  };

  const pushNotification = (notification) => {
    const entry = {
      id: notification.id || timestampId('notification'),
      createdAt: Date.now(),
      ...notification,
    };
    notifications.push(entry);
    return entry;
  };

  return {
    async runTrigger(input = {}) {
      const trigger = input.trigger || 'daily-7am';

      if (trigger === 'daily-7am') {
        const weekSlots = buildWeekSlots(input.weekMeals || []);
        const mealGaps = weekSlots.filter((slot) => !slot.meal);
        const scheduleResult = scheduleAgent.execute({ events: input.events || [] }, { source: trigger });

        const mealGapSuggestion = persistSuggestion(trigger, {
          id: timestampId('meal-gap-summary'),
          type: 'meal_gaps',
          agent: 'meal',
          title: `Found ${mealGaps.length} unplanned meal slot(s) this week`,
          payload: { mealGaps },
          confidence: mealGaps.length === 0 ? 0.96 : 0.88,
        });

        const conflictSuggestions = scheduleResult.suggestions
          .filter((suggestion) => suggestion.type === 'conflict')
          .map((suggestion) => persistSuggestion(trigger, { ...suggestion, agent: 'schedule' }));

        const digest = persistSuggestion(trigger, {
          id: timestampId('morning-digest'),
          type: 'morning_digest',
          agent: 'orchestrator',
          title: 'Morning digest generated',
          payload: {
            mealGapCount: mealGaps.length,
            scheduleConflictCount: conflictSuggestions.length,
            scheduleSummary: scheduleResult.summary,
          },
          confidence: 0.9,
        });

        const parentNotification = pushNotification({
          audience: ['parents'],
          channel: 'push',
          message: `Morning digest: ${mealGaps.length} meal gap(s), ${conflictSuggestions.length} schedule conflict(s).`,
          dashboardCardId: digest.id,
        });

        return {
          ok: true,
          trigger,
          dashboard: [digest, mealGapSuggestion, ...conflictSuggestions],
          notifications: [parentNotification],
        };
      }

      if (trigger === 'task-completed') {
        const task = input.task || {};
        if (!task.requiresPhoto) {
          return { ok: true, trigger, skipped: 'Task does not require photo evidence.' };
        }

        const { score, verdict } = scorePhotoEvidence(input.photo || {});
        const suggestion = persistSuggestion(trigger, {
          id: timestampId('photo-review'),
          type: 'photo_precheck',
          agent: 'task',
          title: `${verdict} (${Math.round(score * 100)}%)`,
          payload: {
            taskId: task.id,
            confidenceScore: score,
            childId: input.childId || null,
          },
          confidence: score,
        });

        const parentNotification = pushNotification({
          audience: ['parents'],
          channel: 'push',
          message: `${verdict} (${Math.round(score * 100)}%) for ${task.title || 'completed task'}`,
          suggestionId: suggestion.id,
        });

        return { ok: true, trigger, suggestion, notifications: [parentNotification] };
      }

      if (trigger === 'sunday-evening') {
        const weekSlots = buildWeekSlots(input.weekMeals || []);
        const emptySlots = weekSlots.filter((slot) => !slot.meal);
        const mealPlan = mealAgent.execute(
          {
            prompt: 'Generate family meal plan with pantry optimization',
            inventory: input.pantry || [],
            mealHistory: input.mealHistory || [],
            familySize: input.familySize || 4,
          },
          { source: trigger },
        );

        const plannedMeals = mealPlan.suggestions.slice(0, Math.max(emptySlots.length, 1));
        const groceryList = listMissingIngredients(plannedMeals, input.pantry || []);

        const mealSuggestion = persistSuggestion(trigger, {
          id: timestampId('weekly-meal-plan'),
          type: 'weekly_meal_fill',
          agent: 'meal',
          title: `mealAgent filled ${Math.min(emptySlots.length, plannedMeals.length)} empty slot(s)`,
          payload: {
            emptySlots,
            plannedMeals,
          },
          confidence: 0.89,
        });

        const grocerySuggestion = persistSuggestion(trigger, {
          id: timestampId('weekly-grocery-list'),
          type: 'grocery_list',
          agent: 'meal',
          title: 'Grocery list generated from meals minus pantry',
          payload: { groceryList },
          confidence: 0.92,
        });

        const familyNotification = pushNotification({
          audience: ['parents'],
          channel: 'push',
          message: "This week's plan is ready",
          suggestionIds: [mealSuggestion.id, grocerySuggestion.id],
        });

        return {
          ok: true,
          trigger,
          suggestions: [mealSuggestion, grocerySuggestion],
          notifications: [familyNotification],
        };
      }

      if (trigger === 'reward-threshold') {
        const childName = input.childName || 'Your child';
        const rewardName = input.rewardName || 'reward';
        const notification = pushNotification({
          audience: ['parents', 'child'],
          channel: 'push',
          message: `${childName} can now afford ${rewardName}!`,
        });

        return { ok: true, trigger, notifications: [notification] };
      }

      if (trigger === 'event-added') {
        const newEvent = input.event;
        const existingEvents = input.events || [];
        const candidates = existingEvents.filter((event) => sameDay(event.startAt, newEvent.startAt) && within24Hours(event.startAt, newEvent.startAt));

        if (candidates.length === 0) {
          return { ok: true, trigger, skipped: 'No nearby same-day events.' };
        }

        const scheduleResult = scheduleAgent.execute(
          {
            events: [...candidates, newEvent].map((event) => ({
              ...event,
              start: event.start,
              end: event.end,
              startTime: event.startTime,
              endTime: event.endTime,
            })),
          },
          { source: trigger },
        );

        const conflictSuggestions = scheduleResult.suggestions
          .filter((suggestion) => suggestion.type === 'conflict')
          .map((suggestion) => persistSuggestion(trigger, { ...suggestion, agent: 'schedule' }));

        if (conflictSuggestions.length > 0) {
          toasts.push({
            id: timestampId('schedule-toast'),
            level: 'warning',
            message: `Scheduling conflict detected for ${newEvent.title || 'new event'}.`,
            createdAt: Date.now(),
          });
        }

        return {
          ok: true,
          trigger,
          conflicts: conflictSuggestions,
          toasts: toasts.slice(-1),
        };
      }

      return { ok: false, trigger, error: 'Unsupported trigger' };
    },

    async listSuggestions() {
      return {
        collection: 'kinflow_agent_suggestions',
        count: kinflowAgentSuggestions.length,
        items: [...kinflowAgentSuggestions],
      };
    },

    async listNotifications() {
      return {
        count: notifications.length,
        items: [...notifications],
      };
    },

    async listToasts() {
      return {
        count: toasts.length,
        items: [...toasts],
      };
    },

    getCronDefinitions() {
      return {
        firebase: [
          {
            id: 'daily-7am',
            schedule: '0 7 * * *',
            timezone: 'local',
            handler: 'runTrigger({ trigger: "daily-7am" })',
          },
          {
            id: 'sunday-evening',
            schedule: '0 18 * * 0',
            timezone: 'local',
            handler: 'runTrigger({ trigger: "sunday-evening" })',
          },
        ],
        vercel: [
          {
            path: '/api/cron/daily-morning-digest',
            schedule: '0 7 * * *',
          },
          {
            path: '/api/cron/sunday-meal-plan',
            schedule: '0 18 * * 0',
          },
        ],
      };
    },
  };
};
