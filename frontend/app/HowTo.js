"use client";

import { useState } from "react";

const MOTION_EXAMPLE = `Timestamp,x,y,z
1638504685.00,0.012,-0.034,0.991
1638504685.02,0.010,-0.036,0.989
1638504685.04,0.011,-0.035,0.990`;

const HR_EXAMPLE = `1638504690.0,58
1638504695.0,57
1638504700.0,57`;

const STEPS = [
  {
    chip: "Record",
    title: "Record a night",
    text: [
      "Wear your Apple Watch to bed and record the whole night with an app that logs the watch's raw wrist motion and heart rate. Sensor Logger is one app that lists both.",
      "Apple's built-in Health export does not normally include raw motion, so it cannot be used on its own.",
    ],
  },
  {
    chip: "Export",
    title: "Export two CSV files",
    text: [
      "In the app, export your recording as CSV and save one file for motion and one for heart rate. Rename them motion.csv and hr.csv so they are easy to tell apart.",
      "Most apps export one big file or a folder. If yours does, keep only the motion columns for the first file and only the heart-rate columns for the second.",
    ],
  },
  {
    chip: "Check",
    title: "Check the files look right",
    text: [
      "Open each file in a text editor or a spreadsheet. They should look like this, with times in seconds.",
    ],
    examples: [
      {
        label: "motion.csv: a header row, then about 50 rows every second, in g",
        code: MOTION_EXAMPLE,
      },
      {
        label: "hr.csv: no header row, one reading every few seconds",
        code: HR_EXAMPLE,
      },
    ],
    note: "The recording should be between 1 and 16 hours long.",
  },
  {
    chip: "Upload",
    title: "Upload and read the result",
    text: [
      "Choose both files below and press Estimate my sleep. It takes a few seconds.",
      "If something is wrong with a file, you will get a plain message saying what, so you can fix it and try again.",
    ],
  },
];

export default function HowTo() {
  const [active, setActive] = useState(0);
  const step = STEPS[active];

  return (
    <div className="howto">
      <h3 className="howto-title">How to get your files</h3>
      <div className="steps" role="tablist" aria-label="Steps">
        {STEPS.map((item, index) => (
          <button
            key={item.chip}
            type="button"
            role="tab"
            aria-selected={index === active}
            className="step-chip"
            onClick={() => setActive(index)}
          >
            <span className="step-num">{index + 1}</span>
            {item.chip}
          </button>
        ))}
      </div>

      <div className="step-body" role="tabpanel">
        <strong>
          Step {active + 1}: {step.title}
        </strong>
        {step.text.map((line) => (
          <p key={line}>{line}</p>
        ))}
        {step.examples &&
          step.examples.map((example) => (
            <div key={example.label}>
              <p className="code-label">{example.label}</p>
              <pre className="code">{example.code}</pre>
            </div>
          ))}
        {step.note && <p className="step-note">{step.note}</p>}

        <div className="step-nav">
          <button
            type="button"
            className="link-button"
            disabled={active === 0}
            onClick={() => setActive(active - 1)}
          >
            Back
          </button>
          <button
            type="button"
            className="link-button"
            disabled={active === STEPS.length - 1}
            onClick={() => setActive(active + 1)}
          >
            Next step
          </button>
        </div>
      </div>
    </div>
  );
}