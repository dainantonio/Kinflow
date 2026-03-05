const toMinutes = (time) => {
  if (typeof time !== 'string' || !time.includes(':')) return null;
  const [hour, minute] = time.split(':').map(Number);
  return hour * 60 + minute;
};

const overlap = (a, b) => a.start < b.end && b.start < a.end;

export const scheduleAgent = {
  id: 'schedule',
  title: 'Schedule Agent',
  execute(input = {}, context = {}) {
    const events = input.events || [];
    const preferredDuration = Number(input.durationMinutes || 60);
    const dayStart = toMinutes(input.dayStart || '08:00');
    const dayEnd = toMinutes(input.dayEnd || '20:00');

    const normalizedEvents = events
      .map((event) => ({
        ...event,
        start: typeof event.start === 'number' ? event.start : toMinutes(event.startTime || event.start),
        end: typeof event.end === 'number' ? event.end : toMinutes(event.endTime || event.end),
      }))
      .filter((event) => Number.isFinite(event.start) && Number.isFinite(event.end))
      .sort((a, b) => a.start - b.start);

    const conflicts = [];
    for (let index = 0; index < normalizedEvents.length - 1; index += 1) {
      const current = normalizedEvents[index];
      const next = normalizedEvents[index + 1];
      if (overlap(current, next)) {
        conflicts.push({
          id: `schedule-conflict-${current.id || index}-${next.id || index + 1}`,
          type: 'conflict',
          title: `Conflict: ${current.title || 'Event'} overlaps ${next.title || 'Event'}`,
          payload: { first: current, second: next },
          confidence: 0.91,
        });
      }
    }

    const suggestions = [...conflicts];

    let cursor = dayStart;
    const booked = normalizedEvents;
    booked.forEach((event) => {
      if (event.start - cursor >= preferredDuration) {
        suggestions.push({
          id: `schedule-slot-${cursor}-${event.start}`,
          type: 'timeslot',
          title: `Free slot from ${Math.floor(cursor / 60).toString().padStart(2, '0')}:${(cursor % 60).toString().padStart(2, '0')} to ${Math.floor(event.start / 60).toString().padStart(2, '0')}:${(event.start % 60).toString().padStart(2, '0')}`,
          payload: { start: cursor, end: event.start },
          confidence: 0.84,
        });
      }
      cursor = Math.max(cursor, event.end);
    });

    if (dayEnd - cursor >= preferredDuration) {
      suggestions.push({
        id: `schedule-slot-${cursor}-${dayEnd}`,
        type: 'timeslot',
        title: `Free slot from ${Math.floor(cursor / 60).toString().padStart(2, '0')}:${(cursor % 60).toString().padStart(2, '0')} to ${Math.floor(dayEnd / 60).toString().padStart(2, '0')}:${(dayEnd % 60).toString().padStart(2, '0')}`,
        payload: { start: cursor, end: dayEnd },
        confidence: 0.84,
      });
    }

    return {
      agent: 'schedule',
      summary: `Detected ${conflicts.length} conflict(s) and ${suggestions.filter((item) => item.type === 'timeslot').length} optimized slot(s).`,
      suggestions,
      metadata: {
        eventCount: normalizedEvents.length,
        generatedAt: Date.now(),
      },
      context,
    };
  },
};
