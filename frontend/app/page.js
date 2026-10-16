"use client";

import { useEffect, useState } from "react";
import { API, DISCLAIMER } from "./api";
import Hypnogram from "./Hypnogram";
import Upload from "./Upload";
import { percent, stageName, stageShares } from "./stages";

// A small crescent moon, drawn as an SVG so it needs no image file.
function Moon() {
  return (
    <svg className="logo" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" fill="currentColor" />
    </svg>
  );
}

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
  const [showUpload, setShowUpload] = useState(false);

  // Runs once, right after the page first appears in the browser.
  useEffect(() => {
    getJson("/samples")
      .then((data) => setSamples(data.samples))
      .catch(() =>
        setError("Could not reach the server. Is the backend running?")
      );
  }, []);

  async function openSample(id) {
    // Clicking the night that is already open closes it and goes back to start.
    if (openId === id) {
      setNight(null);
      setOpenId(null);
      return;
    }
    setLoadingId(id);
    setError(null);
    try {
      const data = await getJson("/samples/" + id);
      setNight(data);
      setOpenId(id);
      setShowUpload(false);
    } catch {
      setError("Could not load that night. Try again.");
    } finally {
      setLoadingId(null);
    }
  }

  function openUpload() {
    setNight(null);
    setOpenId(null);
    setShowUpload(true);
  }

  const scored = night ? night.true_stages.map((stage) => stage >= 0) : [];
  const modelShares = night ? stageShares(night.stages, scored) : [];
  const eegShares = night ? stageShares(night.true_stages, scored) : [];

  return (
    <main className="page">
      <header>
        <h1 className="title">
          <Moon /> Sleep Stager
        </h1>
        <p className="lede">
          A machine learning model that estimates Wake, NREM and REM sleep for a night, using
          only wrist movement and heart rate from an Apple Watch. <br /> <br /> Try one of three sample nights
          the model has never seen.
        </p>
      </header>

      {!showUpload && <p className="disclaimer">{DISCLAIMER}</p>}

      <section>
        <h2 className="section-title">Explore a sample night</h2>
        {!samples && !error && <p>Loading sample nights (~30 seconds)...</p>}
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
                    : openId === sample.id
                    ? "Click to close"
                    : sample.hours + " hours, " + sample.n_epochs + " epochs"}
                </span>
              </button>
            ))}
          </div>
        )}
      </section>

      

      {!showUpload && !night && (
        <section className="start">
          <h2 className="start-title">See how your night looked</h2>
          <p className="start-text">
            Upload your own Apple Watch sleep data and get an estimate of your Wake,
            NREM and REM sleep.
          </p>
          <button className="primary big" type="button" onClick={openUpload}>
            Try your own night
          </button>
          <p className="start-sub"></p>
        </section>
      )}

      {showUpload && <Upload onClose={() => setShowUpload(false)} />}

      {night && (
        <section className="panel" aria-live="polite">
          <h2 className="section-title" style={{ marginBottom: 0 }}>
            How the model did on {night.id}
          </h2>

          <div className="tiles">
            <div className="tile">
              <span className="label">Accuracy</span>
              <span className="value">{percent(night.metrics.accuracy)}</span>
              <span className="hint">Percentage of 30-second intervals correctly predicted.</span>
            </div>
            <div className="tile">
              <span className="label">Macro-F1</span>
              <span className="value">{night.metrics.macro_f1.toFixed(2)}</span>
              <span className="hint">
                Overall performance across all three sleep stages.
              </span>
            </div>
            <div className="tile">
              <span className="label">Cohen&apos;s kappa</span>
              <span className="value">{night.metrics.kappa.toFixed(2)}</span>
              <span className="hint">Agreement with EEG results, adjusted for chance.</span>
            </div>
          </div>

          <Hypnogram night={night} />

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Sleep Stage</th>
                  <th>Model Prediction</th>
                  <th>Actual Stage (EEG-verified)</th>
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
            (the rest had no EEG label).
          </p>
        </section>
      )}

      {night && !showUpload && (
        <div className="own-banner">
          <span>Have Apple Watch data of your own?</span>
          <button className="primary" type="button" onClick={openUpload}>
            Try your own night
          </button>
        </div>
      )}

      <footer className="site-footer">
        <p>
          <strong>Data from:</strong>{" "}
          <a href="https://physionet.org/content/bidsleep-dataset/1.0.1/">
            A Multi-Night Instantaneous Heart Rate and Accelerometry Dataset with
            EEG Sleep Stage Labels
          </a>
          , used under the{" "}
          <a href="https://opendatacommons.org/licenses/by/1-0/">
            Open Data Commons Attribution License v1.0
          </a>
        
        </p>
        <p>
          <strong>Citation:</strong> Song, T., Zhang, Y., Zhou, Z., &amp; Dutta, J.
          (2026). A Multi-Night Instantaneous Heart Rate and Accelerometry Dataset
          with EEG Sleep Stage Labels (version 1.0.1). PhysioNet. RRID:SCR_007345.{" "}
          <a href="https://doi.org/10.13026/rees-1092">
            https://doi.org/10.13026/rees-1092
          </a>
        </p>
        <p>
          .{" "}
          <a href="https://doi.org/10.1109/TBME.2025.3612158">
      
          </a>
        </p>
      </footer>
    </main>
  );
}