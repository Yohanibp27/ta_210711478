export const getShiftDateRange = (shift, now = new Date()) => {
  const start = new Date(now);
  const end = new Date(now);

  const [startHour, startMin] = shift.startTime.split(":").map(Number);
  const [endHour, endMin] = shift.endTime.split(":").map(Number);

  start.setHours(startHour, startMin, 0, 0);
  end.setHours(endHour, endMin, 0, 0);

  if (shift.nextDay && end < start) {
    // shift malam: jam selesai besoknya
    end.setDate(end.getDate() + 1);
  }

  return { start, end };
};
