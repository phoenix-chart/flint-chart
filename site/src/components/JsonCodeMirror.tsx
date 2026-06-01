import { useEffect, useMemo, useRef } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { json } from '@codemirror/lang-json';
import { foldGutter } from '@codemirror/language';
import { EditorView } from '@codemirror/view';
import { scheduleFoldJsonProperties } from '../shared/json-data-fold';
import { siteTheme } from '../shared/theme';

const readOnlyTheme = EditorView.theme({
  '&': { backgroundColor: '#f6f8fa' },
  '.cm-content': { caretColor: 'transparent' },
  '&.cm-focused .cm-cursor': { display: 'none' },
});

interface JsonCodeMirrorProps {
  value: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  /** Change to re-apply default folds (e.g. after loading a new example). */
  foldKey?: string | number;
  foldKeys?: string[];
}

/**
 * JSON editor with `data` (and related keys) collapsed by default.
 * Users can expand via the gutter fold control.
 */
export function JsonCodeMirror({
  value,
  onChange,
  readOnly = false,
  foldKey,
  foldKeys = ['data'],
}: JsonCodeMirrorProps) {
  const viewRef = useRef<EditorView | null>(null);

  const extensions = useMemo(
    () => [
      json(),
      foldGutter(),
      ...(readOnly ? [EditorView.editable.of(false), readOnlyTheme] : []),
    ],
    [readOnly],
  );

  const applyFold = () => {
    const view = viewRef.current;
    if (view) scheduleFoldJsonProperties(view, foldKeys);
  };

  useEffect(() => {
    applyFold();
  }, [foldKey, foldKeys]);

  return (
    <CodeMirror
      value={value}
      height="100%"
      style={{ flex: 1, overflow: 'auto', fontSize: 12, fontFamily: siteTheme.fontMono }}
      extensions={extensions}
      editable={!readOnly}
      onChange={onChange}
      onCreateEditor={(view) => {
        viewRef.current = view;
        scheduleFoldJsonProperties(view, foldKeys);
      }}
    />
  );
}
