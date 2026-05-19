import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Landing } from './routes/Landing.js';
import { RunPage } from './routes/RunPage.js';
import { ScenarioPage } from './routes/ScenarioPage.js';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/scenario/:scenarioId" element={<ScenarioPage />} />
        <Route path="/run/:runId" element={<RunPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
