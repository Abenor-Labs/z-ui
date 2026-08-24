import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

/**
 * Stylesheet order is load-bearing.
 *
 * tokens.css defines the custom properties every component reads (--ink,
 * --paper, --signal, --rule, --recess). It is DARK, and the components are
 * written against it — so the cards on this page are dark surfaces and the
 * components sit in the token context they were built for. The page chrome
 * around them is light, and reads its own `--ob-*` properties instead, so the
 * two palettes never collide.
 *
 * site.css supplies the component classes themselves (.chase, .dial-rotor,
 * .disclosure-clip, .holddrain-fill, .latecritique-field…). It is class-scoped,
 * so it dresses the components without reaching this page's chrome.
 *
 * site/src/styles/base.css is deliberately NOT imported: it owns `body`, `html`
 * and the reset for the other site. orbs.css carries its own reset, owns the
 * page here, and comes last so its palette wins.
 */
import '@site/styles/tokens.css';
import '@site/styles/site.css';
import './orbs.css';

import { App } from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
