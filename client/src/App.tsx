import { Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import Sidebar from './components/Sidebar';
import { useAuth } from './contexts/AuthContext';
import Splash from './pages/Splash';
import Login from './pages/Login';
import NgoProposal from './pages/ngo/NgoProposal';
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
import Inbox from './pages/Inbox';

function CompanyApp() {
  return (
    <div className="flex h-screen overflow-hidden bg-stone-50">
      <Sidebar />
      <main className="flex-1 overflow-y-auto pt-14 lg:pt-0">
        <div className="mx-auto max-w-[1360px] px-8 py-8 md:px-10">
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
            <Route path="/inbox" element={<Inbox />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

export default function App() {
  const { isLoading } = useAuth();

  if (isLoading) return <Splash />;

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/ngo"
        element={
          <ProtectedRoute role="NGO">
            <NgoProposal />
          </ProtectedRoute>
        }
      />
      <Route
        path="/*"
        element={
          <ProtectedRoute role="COMPANY">
            <CompanyApp />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
