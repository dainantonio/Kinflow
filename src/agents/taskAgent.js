const normalizeText = (value = '') => String(value || '').toLowerCase();

export const taskAgent = {
  id: 'task',
  title: 'Task Agent',
  execute(input = {}, context = {}) {
    const { prompt = '', tasks = [], familyMembers = [] } = input;
    const text = normalizeText(prompt);

    const openTasks = tasks.filter((task) => task.status === 'open');
    const overdueTasks = tasks.filter((task) => task.dueDate && new Date(task.dueDate) < new Date());

    const suggestions = [];

    if (text.includes('assign') || text.includes('delegate')) {
      const availableChildren = familyMembers.filter((member) => member.role === 'Child');
      openTasks.slice(0, 3).forEach((task, idx) => {
        const assignee = availableChildren[idx % Math.max(availableChildren.length, 1)]?.name || 'Anyone';
        suggestions.push({
          id: `task-assign-${task.id}`,
          type: 'assignment',
          title: `Assign \"${task.title}\" to ${assignee}`,
          payload: { taskId: task.id, assignee },
          confidence: 0.76,
        });
      });
    }

    if (text.includes('review') || text.includes('overdue')) {
      overdueTasks.slice(0, 3).forEach((task) => {
        suggestions.push({
          id: `task-overdue-${task.id}`,
          type: 'reminder',
          title: `Send reminder for overdue task: ${task.title}`,
          payload: { taskId: task.id },
          confidence: 0.82,
        });
      });
    }

    const summary = suggestions.length
      ? `I found ${suggestions.length} task suggestions based on your request.`
      : 'No task suggestions were generated from that request.';

    return {
      agent: 'task',
      summary,
      suggestions,
      metadata: {
        openTaskCount: openTasks.length,
        overdueTaskCount: overdueTasks.length,
        generatedAt: Date.now(),
      },
      context,
    };
  },
};
