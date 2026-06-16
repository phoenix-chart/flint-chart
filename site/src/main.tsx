import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { Landing } from './routes/Landing';
import { ChartWall } from './routes/ChartWall';
import { Editor } from './routes/Editor';
import { DocSectionPage } from './routes/DocSectionPage';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HashRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/wall/:backend?" element={<ChartWall />} />
        {/* The wall is now the gallery; keep old links working. */}
        <Route path="/gallery" element={<Navigate to="/wall" replace />} />
        <Route path="/gallery/:chartId" element={<Navigate to="/wall" replace />} />
        <Route path="/editor" element={<Editor />} />
        {/* Tutorials merged into Documentation as the "Quick start" group. */}
        <Route path="/tutorials" element={<Navigate to="/documentation/getting-started" replace />} />
        <Route path="/tutorials/:slug" element={<TutorialRedirect />} />
        <Route path="/documentation" element={<DocSectionPage section="documentation" />} />
        <Route path="/documentation/:slug" element={<DocSectionPage section="documentation" />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  </React.StrictMode>,
);

/** Preserve old /tutorials/:slug links by redirecting into /documentation. */
function TutorialRedirect() {
  const { slug } = useParams<{ slug?: string }>();
  return <Navigate to={`/documentation/${slug ?? 'getting-started'}`} replace />;
}
