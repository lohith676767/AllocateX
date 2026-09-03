import { Route, Routes } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Overview from './pages/Overview';
import Regions from './pages/Regions';
import RegionDetail from './pages/RegionDetail';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import Allocations from './pages/Allocations';
import Simulation from './pages/Simulation';
import Reallocations from './pages/Reallocations';
import Evidence from './pages/Evidence';
import Audit from './pages/Audit';

export default function App() {
  return (
    <div className="flex h-screen overflow-hidden bg-ink-950">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-[1400px] px-8 py-7">
          <Routes>
            <Route path="/" element={<Overview />} />
            <Route path="/regions" element={<Regions />} />
            <Route path="/regions/:id" element={<RegionDetail />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/projects/:id" element={<ProjectDetail />} />
            <Route path="/allocations" element={<Allocations />} />
            <Route path="/simulation" element={<Simulation />} />
            <Route path="/simulation/:id" element={<Simulation />} />
            <Route path="/reallocations" element={<Reallocations />} />
            <Route path="/evidence" element={<Evidence />} />
            <Route path="/audit" element={<Audit />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}
