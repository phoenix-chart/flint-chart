import React from 'react';
import ReactDOM from 'react-dom/client';
import '@fontsource-variable/inter/index.css';
import { HashRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { Landing } from './routes/Landing';
import { ChartWall } from './routes/ChartWall';
import { Editor } from './routes/Editor';
import { McpServer } from './routes/McpServer';
import { DocSectionPage } from './routes/DocSectionPage';
import { DevPlayground } from './routes/DevPlayground';

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
        <Route path="/mcp" element={<McpServer />} />
        <Route path="/dev-playground" element={<DevPlayground />} />
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
