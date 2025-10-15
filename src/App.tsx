import React, { useState, useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts";
import { motion, AnimatePresence } from "framer-motion";

interface WaveformData {
  time: number;
  value: number;
}

interface Metadata {
  breakerId: string;
  testDate: string;
  engineer: string;
}

interface Features {
  max?: number;
  min?: number;
  mean?: number;
  samples?: number;
}

interface Prediction {
  classification: string;
  confidence: number;
  recommended_action: string;
  features: Features;
}

export default function DcrmDashboard() {
  const [view, setView] = useState("dashboard");
  const [waveform, setWaveform] = useState<WaveformData[]>([]);
  const [metadata, setMetadata] = useState<Metadata>({ breakerId: "", testDate: "", engineer: "" });
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [loading, setLoading] = useState(false);

  function parseCSV(text: string): WaveformData[] {
    const lines = text.trim().split(/\r?\n/).filter(Boolean);
    const rows: WaveformData[] = [];
    for (let line of lines) {
      const [t, v] = line.split(/,|\s+/).map(Number);
      if (!isNaN(t) && !isNaN(v)) rows.push({ time: t, value: v });
    }
    return rows;
  }

  async function handleUploadFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const txt = await f.text();
    const rows = parseCSV(txt);
    setWaveform(rows);
    setView("waveform");
  }

  function mockFeatureExtraction(rows: WaveformData[]): Features {
    if (!rows.length) return {};
    const values = rows.map(r => r.value);
    const max = Math.max(...values);
    const min = Math.min(...values);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    return { max, min, mean, samples: values.length };
  }

  async function requestPrediction() {
    setLoading(true);
    const features = mockFeatureExtraction(waveform);
    await new Promise(r => setTimeout(r, 800));
    const mock: Prediction = {
      classification: "Possible Arcing Contact Wear",
      confidence: 0.87,
      recommended_action: "Schedule inspection of arcing contacts and alignment check.",
      features
    };
    setPrediction(mock);
    setLoading(false);
    setView("predictions");
  }

  const features = useMemo(() => mockFeatureExtraction(waveform), [waveform]);

  const baseCard = "bg-white/70 backdrop-blur-lg shadow-lg rounded-2xl p-6 border border-white/30";
  const button = "px-4 py-2 rounded-xl font-medium transition-all duration-300";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-800 text-slate-100 font-sans">
      <header className="bg-white/10 backdrop-blur-lg sticky top-0 z-20 border-b border-white/10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <motion.h1 initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-lg font-semibold tracking-wide">
            ⚡ AI-Based DCRM Analysis
          </motion.h1>
          <nav className="flex gap-4 text-sm">
            {['dashboard', 'upload', 'waveform', 'predictions'].map(v => (
              <button key={v} onClick={() => setView(v)} className={`hover:text-emerald-400 capitalize transition-colors duration-300 ${view === v ? 'text-emerald-300' : ''}`}>{v}</button>
            ))}
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6">
        <AnimatePresence mode="wait">
          {view === 'dashboard' && (
            <motion.section key="dash" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className={`col-span-2 ${baseCard}`}>
                <h2 className="text-xl font-semibold mb-4 text-slate-800">Quick Actions</h2>
                <div className="flex flex-wrap gap-3">
                  <label className="cursor-pointer bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl transition-all duration-300">
                    Upload DCRM CSV<input type="file" accept=".csv" className="hidden" onChange={handleUploadFile} />
                  </label>
                  <button onClick={requestPrediction} disabled={!waveform.length || loading} className={`${button} bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white`}>
                    {loading ? 'Processing...' : 'Run Prediction'}
                  </button>
                </div>
                <div className="mt-6">
                  <h3 className="text-sm mb-2 text-slate-600">Recent Waveform</h3>
                  {waveform.length ? (
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={waveform}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                          <XAxis dataKey="time" stroke="#666" />
                          <YAxis stroke="#666" />
                          <Tooltip contentStyle={{ background: '#111', border: 'none', borderRadius: '8px' }} />
                          <Line type="monotone" dataKey="value" stroke="#4ade80" strokeWidth={2} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  ) : <div className="text-slate-500 text-sm">No waveform uploaded yet.</div>}
                </div>
              </div>

              <aside className={baseCard}>
                <h3 className="font-semibold text-lg mb-2 text-slate-800">Metadata</h3>
                <input placeholder="Breaker ID" value={metadata.breakerId} onChange={e => setMetadata({ ...metadata, breakerId: e.target.value })} className="w-full bg-white/40 border border-slate-300 rounded-xl p-2 mb-2 placeholder-slate-500 text-slate-800" />
                <input placeholder="Test Date" value={metadata.testDate} onChange={e => setMetadata({ ...metadata, testDate: e.target.value })} className="w-full bg-white/40 border border-slate-300 rounded-xl p-2 mb-2 placeholder-slate-500 text-slate-800" />
                <input placeholder="Engineer" value={metadata.engineer} onChange={e => setMetadata({ ...metadata, engineer: e.target.value })} className="w-full bg-white/40 border border-slate-300 rounded-xl p-2 placeholder-slate-500 text-slate-800" />
                <div className="mt-4 text-sm text-slate-700 space-y-1">
                  <div>Samples: {features.samples ?? 0}</div>
                  <div>Mean: {features.mean ? features.mean.toFixed(3) : '-'}</div>
                </div>
              </aside>
            </motion.section>
          )}

          {view === 'waveform' && (
            <motion.section key="wave" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className={baseCard}>
              <h2 className="text-xl font-semibold mb-4 text-slate-800">Waveform Viewer</h2>
              {waveform.length ? (
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={waveform}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff25" />
                      <XAxis dataKey="time" stroke="#666" />
                      <YAxis stroke="#666" />
                      <Tooltip contentStyle={{ background: '#111', border: 'none', borderRadius: '8px' }} />
                      <Line type="monotone" dataKey="value" stroke="#818cf8" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : <div className="text-slate-500">No waveform uploaded yet.</div>}
              <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-indigo-100 text-slate-800 rounded-xl p-3">
                  <div className="text-xs text-slate-600">Max</div>
                  <div className="text-lg font-semibold">{features.max?.toFixed(4) ?? '-'}</div>
                </div>
                <div className="bg-indigo-100 text-slate-800 rounded-xl p-3">
                  <div className="text-xs text-slate-600">Min</div>
                  <div className="text-lg font-semibold">{features.min?.toFixed(4) ?? '-'}</div>
                </div>
                <div className="bg-indigo-100 text-slate-800 rounded-xl p-3">
                  <div className="text-xs text-slate-600">Mean</div>
                  <div className="text-lg font-semibold">{features.mean ? features.mean.toFixed(4) : '-'}</div>
                </div>
                <div className="bg-indigo-100 text-slate-800 rounded-xl p-3">
                  <div className="text-xs text-slate-600">Samples</div>
                  <div className="text-lg font-semibold">{features.samples ?? 0}</div>
                </div>
              </div>
            </motion.section>
          )}

          {view === 'predictions' && (
            <motion.section key="pred" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className={baseCard}>
              <h2 className="text-xl font-semibold mb-4 text-slate-800">AI Prediction & Recommendations</h2>
              {prediction ? (
                <div className="space-y-4">
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                    <div className="text-sm text-slate-600">Classification</div>
                    <div className="text-emerald-700 font-semibold text-lg">{prediction.classification}</div>
                    <div className="text-slate-600 text-sm">Confidence: {(prediction.confidence * 100).toFixed(1)}%</div>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <div className="text-sm text-slate-600 mb-1">Recommended Action</div>
                    <div className="text-slate-800">{prediction.recommended_action}</div>
                  </div>
                  <div className="bg-slate-100 border border-slate-300 rounded-xl p-4">
                    <div className="text-sm text-slate-600 mb-2">Extracted Features</div>
                    <pre className="text-xs bg-slate-800 text-slate-100 p-3 rounded-xl overflow-auto">{JSON.stringify(prediction.features, null, 2)}</pre>
                  </div>
                </div>
              ) : <div className="text-slate-500">No prediction yet.</div>}
              <div className="mt-6 flex gap-3">
                <button onClick={requestPrediction} disabled={!waveform.length || loading} className={`${button} bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white`}>
                  {loading ? 'Processing...' : 'Run Prediction'}
                </button>
                <button onClick={() => setView('waveform')} className={`${button} bg-slate-200 hover:bg-slate-300 text-slate-800`}>Back to Waveform</button>
              </div>
            </motion.section>
          )}

          {view === 'upload' && (
            <motion.section key="up" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className={baseCard}>
              <h2 className="text-xl font-semibold mb-4 text-slate-800">Upload DCRM Data</h2>
              <p className="text-slate-600 text-sm mb-3">Accepted format: CSV (time,value)</p>
              <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-indigo-500 transition-colors duration-300">
                <input type="file" accept=".csv" onChange={handleUploadFile} className="block text-sm mx-auto file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-700 file:cursor-pointer cursor-pointer" />
                <p className="mt-2 text-xs text-slate-500">Select a CSV file to upload</p>
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        <footer className="mt-8 text-xs text-slate-300 text-center">© Ministry of Power | AI-Driven DCRM Prototype UI | Designed for modern EHV diagnostics</footer>
      </main>
    </div>
  );
}
