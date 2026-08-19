import { Route, Routes, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'motion/react';
import { Shell } from './components/Shell';
import { Home } from './pages/Home';
import { Library } from './pages/Library';
import { Cli } from './pages/Cli';
import { Architecture } from './pages/Architecture';
import { Docs } from './pages/Docs';
import { NotFound } from './pages/NotFound';
import { Candidates } from './pages/Candidates';
import { DialPage } from './pages/detail/DialPage';
import { ChasePage } from './pages/detail/ChasePage';
import { HeftPage } from './pages/detail/HeftPage';
import { DisclosurePage } from './pages/detail/DisclosurePage';
import { HoldDrainPage } from './pages/detail/HoldDrainPage';
import { LateCritiquePage } from './pages/detail/LateCritiquePage';
import { ScrambleRevealPage } from './pages/detail/ScrambleRevealPage';

export function App() {
  const location = useLocation();
  return (
    <Shell>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<Home />} />
          <Route path="/components" element={<Library />} />
          <Route path="/components/dial" element={<DialPage />} />
          <Route path="/components/chase" element={<ChasePage />} />
          <Route path="/components/heft" element={<HeftPage />} />
          <Route path="/components/disclosure" element={<DisclosurePage />} />
          <Route path="/components/hold-drain" element={<HoldDrainPage />} />
          <Route path="/components/late-critique" element={<LateCritiquePage />} />
          <Route path="/components/scramble-reveal" element={<ScrambleRevealPage />} />
          <Route path="/candidates" element={<Candidates />} />
          <Route path="/cli" element={<Cli />} />
          <Route path="/architecture" element={<Architecture />} />
          <Route path="/docs" element={<Docs />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AnimatePresence>
    </Shell>
  );
}
