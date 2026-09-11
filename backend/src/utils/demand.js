function levelFromCount(count, capacity) {
  const cap = capacity || 40;
  const ratio = count / cap;
  if (ratio < 0.4) return 'low';
  if (ratio < 0.75) return 'medium';
  return 'high';
}

function predictDemand({ samples, hour, day, capacity }) {
  const matching = samples.filter((s) => s.hour_of_day === hour && s.day_of_week === day);
  const nearby = samples.filter(
    (s) => Math.abs(s.hour_of_day - hour) <= 1 && s.day_of_week === day
  );
  const pool = matching.length ? matching : nearby.length ? nearby : samples;
  if (!pool.length) {
    const fallback = hour >= 8 && hour <= 10 ? 28 : hour >= 16 && hour <= 18 ? 32 : 14;
    return {
      predictedPassengers: fallback,
      level: levelFromCount(fallback, capacity),
      method: 'schedule_heuristic',
    };
  }
  const avg = pool.reduce((sum, s) => sum + Number(s.passenger_count), 0) / pool.length;
  const predicted = Math.round(avg);
  return {
    predictedPassengers: predicted,
    level: levelFromCount(predicted, capacity),
    method: matching.length ? 'historical_exact' : 'historical_nearby',
  };
}

module.exports = { predictDemand, levelFromCount };
