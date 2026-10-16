"use client";

import { useEffect, useState } from "react";
import { API } from "./api";
import Hypnogram from "./Hypnogram";
import Upload from "./Upload";
import { percent, stageName, stageShares } from "./stages";

const DISCLAIMER =
  "Research estimates from a wrist-worn device. Not a medical diagnosis.";

async function getJson(path) {
  const response = await fetch(API + path);
  if (!response.ok) {
    throw new Error("The server answered " + response.status);
  }
  return response.json();
}

export default function Home() {
  const [samples, setSamples] = useState(null);
  const [night, setNight] = useState(null);
  const [openId, setOpenId] = useState(null);
  const [loadingId, setLoadingId] = useState(null);
  const [error, setError] = useState(null);

  // Runs once, right after the page first appears in the browser.
  useEffect(() => {
    getJson("/samples")
      .then((data) => setSamples(data.samples))
      .catch(() =>
        setError("Could not reach the server. Is the backend running?")
      );
  }, []);

  async function openSample(id) {
    setLoadingId(id);
    setError(null);
    try {
      const data = await getJson("/samples/" + id);
      setNight(data);
      setOpenId(id);
    } catch {
      setError("Could not load that night. Try again.");
    } finally {
      setLoadingId(null);
    }
  }

  const scored = night ? night.true_stages.map((stage) => stage >= 0) : [];
  const modelShares = night ? stageShares(night.stages, scored) : [];
  const eegShares = night ? stageShares(night.true_stages, scored) : [];

  return (
    <main className="page">
      <header>
        <h1 className="title">Sleep Stager</h1>
        <p className="lede">
          Estimates Wake, NREM and REM for every 30 seconds of a night, using
          only wrist movement and heart rate. Try one of three sample nights
          the model has never seen.
        </p>
      </header>

      <p className="disclaimer">{DISCLAIMER}</p>

      <section>
        <h2 className="section-title">Sample nights</h2>
        {!samples && !error && <p>Loading sample nights…</p>}
        {error && <p className="error">{error}</p>}
        {samples && (
          <div className="picker">
            {samples.map((sample) => (
              <button
                key={sample.id}
                className="sample"
                aria-pressed={openId === sample.id}
                disabled={loadingId !== null}
                onClick={() => openSample(sample.id)}
              >
                <span className="name">{sample.id}</span>
                <span className="detail">
                  {loadingId === sample.id
                    ? "Loading…"
                    : sample.hours + " hours, " + sample.n_epochs + " epochs"}
                </span>
              </button>
            ))}
          </div>
        )}
      </section>

      {night && (
        <section className="panel" aria-live="polite">
          <h2 className="section-title" style={{ marginBottom: 0 }}>
            How the model did on {night.id}
          </h2>

          <div className="tiles">
            <div className="tile">
              <span className="label">Accuracy</span>
              <span className="value">{percent(night.metrics.accuracy)}</span>
              <span className="hint">Share of epochs it got right.</span>
            </div>
            <div className="tile">
              <span className="label">Macro-F1</span>
              <span className="value">{night.metrics.macro_f1.toFixed(2)}</span>
              <span className="hint">
                Wake, NREM and REM count equally, so rare REM matters.
              </span>
            </div>
            <div className="tile">
              <span className="label">Cohen&apos;s kappa</span>
              <span className="value">{night.metrics.kappa.toFixed(2)}</span>
              <span className="hint">Agreement beyond what chance gives.</span>
            </div>
          </div>

          <Hypnogram night={night} />

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Stage</th>
                  <th>Model</th>
                  <th>EEG answer</th>
                </tr>
              </thead>
              <tbody>
                {[0, 1, 2].map((stage) => (
                  <tr key={stage}>
                    <td>{stageName(night.stage_names, stage)}</td>
                    <td>{percent(modelShares[stage])}</td>
                    <td>{percent(eegShares[stage])}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="footer">
            Scored on {night.metrics.n_scored_epochs} of {night.n_epochs} epochs
            (the rest had no EEG label). {night.attribution}
          </p>
        </section>
      )}

      <Upload />
    </main>
  );
}