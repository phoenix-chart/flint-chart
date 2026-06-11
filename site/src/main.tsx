import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Landing } from './routes/Landing';
import { Gallery } from './routes/Gallery';
import { Editor } from './routes/Editor';
import { DocSectionPage } from './routes/DocSectionPage';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HashRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/gallery/:chartId?" element={<Gallery />} />
        <Route path="/editor" element={<Editor />} />
        <Route path="/tutorials" element={<DocSectionPage section="tutorials" />} />
        <Route path="/tutorials/:slug" element={<DocSectionPage section="tutorials" />} />
        <Route path="/documentation" element={<DocSectionPage section="documentation" />} />
        <Route path="/documentation/:slug" element={<DocSectionPage section="documentation" />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  </React.StrictMode>,
);
