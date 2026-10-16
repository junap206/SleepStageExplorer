"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { stageName } from "./stages";

// A hypnogram draws the stage on a vertical scale, awake at the top.
// Stage codes are 0 Wake, 1 NREM, 2 REM, so we map them to heights:
// NREM = 0 (bottom), REM = 1, Wake = 2 (top).
const HEIGHT_OF_STAGE = { 0: 2, 1: 0, 2: 1 };
const STAGE_AT_HEIGHT = { 2: 0, 0: 1, 1: 2 };

// Every chart uses the same margins and axis width, so the rows line up.
const MARGIN = { top: 6, right: 12, bottom: 0, left: 0 };
const AXIS_WIDTH = 56;
const TICK = { fill: "var(--muted)", fontSize: 12 };

const MODEL_COLOR = "var(--series-model)";
const EEG_COLOR = "var(--series-eeg)";

function buildRows(night) {
  const hoursPerEpoch = night.epoch_seconds / 3600;
  const rows = night.stages.map((stage, i) => {
    const eeg = night.true_stages ? night.true_stages[i] : -1;
    return {
      t: i * hoursPerEpoch,
      model: HEIGHT_OF_STAGE[stage],
      eeg: eeg >= 0 ? HEIGHT_OF_STAGE[eeg] : null, // null leaves a gap
      modelStage: stage,
      eegStage: eeg,
    };
  });
  // Repeat the last epoch at its end time so it gets a full-width step.
  const last = rows[rows.length - 1];
  rows.push({ ...last, t: rows.length * hoursPerEpoch });
  return rows;
}

// Stretches of the night where the model and the EEG answer differ.
function disagreementRuns(night) {
  const hoursPerEpoch = night.epoch_seconds / 3600;
  const runs = [];
  let start = null;
  night.stages.forEach((stage, i) => {
    const eeg = night.true_stages[i];
    const differs = eeg >= 0 && stage !== eeg;
    if (differs && start === null) start = i;
    if (!differs && start !== null) {
      runs.push([start * hoursPerEpoch, i * hoursPerEpoch]);
      start = null;
    }
  });
  if (start !== null) {
    runs.push([start * hoursPerEpoch, night.stages.length * hoursPerEpoch]);
  }
  return runs;
}

function clock(hours) {
  const minutes = Math.round(hours * 60);
  return Math.floor(minutes / 60) + " h " + String(minutes % 60).padStart(2, "0") + " min";
}

// The one readout that appears while hovering any of the rows.
function NightTooltip({ active, payload, names, hasTruth }) {
  if (!active || !payload || payload.length === 0) return null;
  const row = payload[0].payload;
  const hasEeg = row.eegStage >= 0;
  return (
    <div className="tip">
      <div className="tip-time">{clock(row.t)} into the night</div>
      <div className="tip-row">
        <span className="key" style={{ background: MODEL_COLOR }} />
        <strong>{stageName(names, row.modelStage)}</strong>
        <span>Model</span>
      </div>
      {hasTruth && (
        <div className="tip-row">
          <span className="key" style={{ background: EEG_COLOR }} />
          <strong>{hasEeg ? stageName(names, row.eegStage) : "No label"}</strong>
          <span>Answer</span>
        </div>
      )}
      {hasTruth && hasEeg && (
        <div className="tip-note">
          {row.modelStage === row.eegStage ? "They agree" : "They differ"}
        </div>
      )}
    </div>
  );
}

function RowTitle({ color, title, note }) {
  return (
    <div className="row-title">
      {color && <span className="key" style={{ background: color }} />}
      <strong>{title}</strong>
      <span>{note}</span>
    </div>
  );
}

function StageChart({ rows, dataKey, color, ticks, totalHours, names, tooltip, label }) {
  return (
    <div role="img" aria-label={label}>
      <ResponsiveContainer width="100%" height={132}>
        <LineChart data={rows} margin={MARGIN} syncId="night">
          <CartesianGrid stroke="var(--line)" />
          <XAxis type="number" dataKey="t" domain={[0, totalHours]} ticks={ticks} hide />
          <YAxis
            type="number"
            domain={[-0.3, 2.3]}
            ticks={[0, 1, 2]}
            width={AXIS_WIDTH}
            tick={TICK}
            tickLine={false}
            axisLine={{ stroke: "var(--line)" }}
            tickFormatter={(height) => stageName(names, STAGE_AT_HEIGHT[height])}
          />
          <Tooltip
            content={tooltip}
            cursor={{ stroke: "var(--muted)", strokeWidth: 1 }}
            isAnimationActive={false}
          />
          <Line
            type="stepAfter"
            dataKey={dataKey}
            stroke={color}
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
            dot={false}
            activeDot={false}
            isAnimationActive={false}
            connectNulls={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function DisagreementStrip({ rows, runs, ticks, totalHours, label }) {
  return (
    <div role="img" aria-label={label}>
      <ResponsiveContainer width="100%" height={72}>
        <LineChart data={rows} margin={MARGIN} syncId="night">
          <CartesianGrid stroke="var(--line)" horizontal={false} />
          <XAxis
            type="number"
            dataKey="t"
            domain={[0, totalHours]}
            ticks={ticks}
            tick={TICK}
            tickLine={false}
            axisLine={{ stroke: "var(--line)" }}
            tickFormatter={(hours) => hours + " h"}
          />
          <YAxis
            type="number"
            domain={[0, 1]}
            width={AXIS_WIDTH}
            tick={false}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            content={() => null}
            cursor={{ stroke: "var(--muted)", strokeWidth: 1 }}
            isAnimationActive={false}
          />
          {runs.map(([start, end]) => (
            <ReferenceArea
              key={start}
              x1={start}
              x2={end}
              y1={0}
              y2={1}
              fill="var(--muted)"
              fillOpacity={0.85}
              stroke="none"
            />
          ))}
          <Line dataKey="model" stroke="none" dot={false} activeDot={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// Text version of the same information, one row per hour.
function HourTable({ night }) {
  const hasTruth = Boolean(night.true_stages);
  const perHour = 3600 / night.epoch_seconds;
  const hours = Math.ceil(night.stages.length / perHour);
  const names = night.stage_names;
  const text = (shares) =>
    shares.every((share) => share === 0)
      ? "–"
      : shares.map((share) => Math.round(share * 100) + "%").join(" · ");

  return (
    <details className="table-twin">
      <summary>Show this as a table</summary>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Hour</th>
              <th>
                Model: {stageName(names, 0)} · {stageName(names, 1)} · {stageName(names, 2)}
              </th>
              {hasTruth && (
                <th>
                  EEG: {stageName(names, 0)} · {stageName(names, 1)} · {stageName(names, 2)}
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: hours }, (_, hour) => {
              const from = hour * perHour;
              const to = from + perHour;
              const stages = night.stages.slice(from, to);
              const truth = hasTruth ? night.true_stages.slice(from, to) : [];
              const scored = hasTruth ? truth.map((stage) => stage >= 0) : stages.map(() => true);
              return (
                <tr key={hour}>
                  <td>{hour + 1}</td>
                  <td>{text(stageShares(stages, scored))}</td>
                  {hasTruth && <td>{text(stageShares(truth, scored))}</td>}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </details>
  );
}

export default function Hypnogram({ night }) {
  const rows = buildRows(night);
  const hasTruth = Boolean(night.true_stages);
  const runs = hasTruth ? disagreementRuns(night) : [];
  const totalHours = (night.stages.length * night.epoch_seconds) / 3600;
  const ticks = Array.from({ length: Math.floor(totalHours) + 1 }, (_, hour) => hour);
  const names = night.stage_names;

  const truth = night.true_stages || [];
  const scoredCount = truth.filter((stage) => stage >= 0).length;
  const differCount = truth.filter(
    (stage, i) => stage >= 0 && stage !== night.stages[i]
  ).length;
  const differShare = scoredCount ? Math.round((differCount / scoredCount) * 100) : 0;

  const tooltip = <NightTooltip names={names} hasTruth={hasTruth} />;

  return (
    <div className="hypno">
      <p className="hint-line">
        {" "}
        {hasTruth
          ? "Hover anywhere on the chart to compare the two at the same moment."
          : "Hover on the chart to read the estimate at any moment."}
      </p>

      <RowTitle color={MODEL_COLOR} title="Model Prediction" note="estimated from the watch data" />
      <StageChart
        rows={rows}
        dataKey="model"
        color={MODEL_COLOR}
        ticks={ticks}
        totalHours={totalHours}
        names={names}
        tooltip={tooltip}
        label="Model estimate of sleep stage across the night"
      />

      {hasTruth && (
        <>
          <RowTitle color={EEG_COLOR} title="Actual Sleep Stage (EEG-verified)" note="scored by experts from brain recordings" />
          <StageChart
            rows={rows}
            dataKey="eeg"
            color={EEG_COLOR}
            ticks={ticks}
            totalHours={totalHours}
            names={names}
            tooltip={() => null}
            label="EEG-scored sleep stage across the night"
          />

          <RowTitle
            title="Where they disagree"
            note={differShare + "% of scored epochs, marked in gray"}
          />
          <DisagreementStrip
            rows={rows}
            runs={runs}
            ticks={ticks}
            totalHours={totalHours}
            label={"Stretches where the model and the EEG answer differ: " + differShare + " percent of scored epochs"}
          />
        </>
      )}

      
    </div>
  );
}