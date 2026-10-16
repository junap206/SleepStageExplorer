"use client";

import { useState } from "react";
import { API, DISCLAIMER } from "./api";
import HowTo from "./HowTo";
import Hypnogram from "./Hypnogram";
import { percent, stageName, stageShares } from "./stages";

// Turns whatever the server answered into a list of plain-English messages.
async function readProblems(response) {
  if (response.status === 413) {
    return ["One of the files is too large. The limit is 200 MB per file."];
  }
  if (response.status === 422) {
    return ["Both files are needed: choose a motion file and a heart-rate file."];
  }
  try {
    const body = await response.json();
    if (Array.isArray(body.detail) && body.detail.every((x) => typeof x === "string")) {
      return body.detail; // our own list of problems
    }
    if (typeof body.detail === "string") return [body.detail];
  } catch {
    // the body was not JSON; fall through
  }
  return ["The server could not process these files (error " + response.status + ")."];
}

function FilePicker({ label, hint, onPick, disabled }) {
  return (
    <label className="file-box">
      <span className="file-label">{label}</span>
      <span className="file-hint">{hint}</span>
      <input
        type="file"
        accept=".csv,text/csv"
        disabled={disabled}
        onChange={(event) => onPick(event.target.files[0] || null)}
      />
    </label>
  );
}

export default function Upload({ onClose }) {
  const [motion, setMotion] = useState(null);
  const [hr, setHr] = useState(null);
  const [busy, setBusy] = useState(false);
  const [problems, setProblems] = useState([]);
  const [result, setResult] = useState(null);

  async function submit(event) {
    event.preventDefault();
    if (!motion || !hr) {
      setProblems(["Choose both files first."]);
      return;
    }
    setBusy(true);
    setProblems([]);
    setResult(null);
    try {
      // FormData is how a browser sends files. The names must match the
      // parameter names in the backend's /predict function.
      const form = new FormData();
      form.append("motion_file", motion);
      form.append("hr_file", hr);
      const response = await fetch(API + "/predict", { method: "POST", body: form });
      if (!response.ok) {
        setProblems(await readProblems(response));
        return;
      }
      setResult(await response.json());
    } catch {
      setProblems(["Could not reach the server. Is the backend running?"]);
    } finally {
      setBusy(false);
    }
  }

  const shares = result ? stageShares(result.stages, result.stages.map(() => true)) : [];

  return (
    <section className="panel">
      <div className="panel-head">
        <h2 className="section-title" style={{ marginBottom: 0 }}>
          Try your own night
        </h2>
        <button type="button" className="link-button" onClick={onClose}>
          ← Back to start
        </button>
      </div>
      <p className="disclaimer">{DISCLAIMER}</p>
      <p className="privacy">
        Your files are read once to make the estimate and are not saved. Nothing is
        kept after the page is closed.
      </p>

      <HowTo />

      <form onSubmit={submit} className="upload-form">
        <div className="file-grid">
          <FilePicker
            label="Motion file"
            hint="motion.csv with columns Timestamp, x, y, z (about 50 readings a second)"
            onPick={setMotion}
            disabled={busy}
          />
          <FilePicker
            label="Heart-rate file"
            hint="hr.csv with two columns: time, bpm (no header row)"
            onPick={setHr}
            disabled={busy}
          />
        </div>
        <button className="primary" type="submit" disabled={busy}>
          {busy ? "Working… this can take a few seconds" : "Estimate my sleep"}
        </button>
      </form>

      {problems.length > 0 && (
        <div className="problems" role="alert">
          <strong>We could not use these files:</strong>
          <ul>
            {problems.map((problem) => (
              <li key={problem}>{problem}</li>
            ))}
          </ul>
        </div>
      )}

      {result && (
        <div aria-live="polite" className="upload-result">
          <p className="footer">
            There is no EEG answer for your own night, so there is no accuracy score.
            This is an estimate only.
          </p>
          <Hypnogram night={result} />
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Stage</th>
                  <th>Share of the night</th>
                </tr>
              </thead>
              <tbody>
                {[0, 1, 2].map((stage) => (
                  <tr key={stage}>
                    <td>{stageName(result.stage_names, stage)}</td>
                    <td>{percent(shares[stage])}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="footer">{result.disclaimer}</p>
        </div>
      )}
    </section>
  );
}