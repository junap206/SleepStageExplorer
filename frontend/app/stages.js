// Small helpers shared by the page and the chart.

// The backend may send stage names as a list or as an object keyed by number.
export function stageName(names, index) {
  if (Array.isArray(names)) return names[index];
  return names[index] ?? names[String(index)];
}

// Share of epochs in each stage (0, 1, 2), counting only epochs the EEG
// experts could label (true stage -1 means unknown).
export function stageShares(stages, scored) {
  const counts = [0, 0, 0];
  let total = 0;
  stages.forEach((stage, i) => {
    if (scored[i] && stage >= 0) {
      counts[stage] += 1;
      total += 1;
    }
  });
  return counts.map((count) => (total ? count / total : 0));
}

export function percent(value) {
  return (value * 100).toFixed(1) + "%";
}