import { useState } from 'react';
import {
  GooeyStyles,
  GooeyTabs,
  GooeyToggle,
  GooeyDock,
  GooeyLoader,
  GooeyFab,
  GooeyCursor,
} from './GooeyKit';

// Sandbox route: /sandbox/gooey — unlisted, not part of the site's nav or
// PRODUCT FACTS. Exists only to look at liquid-gooey running for real.
export function GooeyDemo() {
  const [tab, setTab] = useState('all');
  const [notify, setNotify] = useState(true);

  return (
    <div style={{ background: '#0b0a12', minHeight: '100vh', padding: 48, color: '#fff' }}>
      <GooeyStyles />

      <h1 style={{ fontSize: 20, margin: 0, marginBottom: 8 }}>liquid-gooey sandbox</h1>
      <p style={{ opacity: 0.6, fontSize: 13, marginTop: 0, marginBottom: 40 }}>
        liquid-gooey@0.1.0 · MIT · Jakub Antalik. Not a Z-UI component.
      </p>

      <Label>GooeyTabs — move effect, rubber trail</Label>
      <GooeyTabs
        tabs={[
          { label: 'All', value: 'all' },
          { label: 'Unread', value: 'unread' },
          { label: 'Archived', value: 'archived' },
        ]}
        value={tab}
        onChange={setTab}
      />

      <Label>GooeyToggle — track and handle stay fused</Label>
      <GooeyToggle checked={notify} onChange={setNotify} label="Notifications" />

      <Label>GooeyDock — neighbours bulge and fuse on hover</Label>
      <GooeyDock
        items={[
          { label: 'Home', icon: '⌂' },
          { label: 'Search', icon: '⌕' },
          { label: 'Mail', icon: '✉' },
          { label: 'Profile', icon: '◔' },
        ]}
      />

      <Label>GooeyLoader — orbiting dots merging at the centre</Label>
      <GooeyLoader />

      <Label>GooeyFab — splits into a fan of actions</Label>
      <div style={{ marginLeft: 120, marginBottom: 40 }}>
        <GooeyFab
          actions={[
            { label: 'Note', icon: '✎', onClick: () => {} },
            { label: 'Photo', icon: '◧', onClick: () => {} },
            { label: 'Link', icon: '⚯', onClick: () => {} },
          ]}
        />
      </div>

      <Label>GooeyCursor — move effect chasing the pointer</Label>
      <GooeyCursor>
        <div
          style={{
            height: 180,
            border: '1px solid rgba(255,255,255,.12)',
            borderRadius: 14,
            display: 'grid',
            placeItems: 'center',
            fontSize: 13,
            opacity: 0.7,
          }}
        >
          move the pointer in here
        </div>
      </GooeyCursor>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 11,
        letterSpacing: '.08em',
        textTransform: 'uppercase',
        opacity: 0.45,
        marginTop: 48,
        marginBottom: 16,
      }}
    >
      {children}
    </div>
  );
}
