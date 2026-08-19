import { Link } from 'react-router-dom';
import { Page } from '../components/Page';
import { Heft } from '@z-ui/registry/heft/heft';

export function NotFound() {
  return (
    <Page title="404">
      <div className="hero" style={{ alignItems: 'start' }}>
        <div className="notfound-copy">
          <h1>404</h1>
          <p className="detail-principle">
            This route isn't in the registry. The boxes below are real heft physics — same
            gravity, same contacts, same friction as{' '}
            <Link to="/components/heft">the component</Link>. They fell over; routes do that too.
          </p>
          <p className="mono" style={{ fontSize: 12, marginTop: 16 }}>
            <Link to="/">← back to a route that exists</Link>
          </p>
        </div>
      </div>
      <div>
        <Heft
          height={360}
          startAsleep
          initialBodies={[
            { w: 110, h: 140, label: '4', fontSize: 72, x: 60, y: -160 },
            { w: 130, h: 130, label: '0', fontSize: 72, x: 240, y: -300 },
            { w: 110, h: 140, label: '4', fontSize: 72, x: 430, y: -450 },
            { w: 70, h: 50, label: 'ERR', x: 600, y: -120 },
          ]}
        />
        <p className="mono-label" style={{ marginTop: 8, opacity: 0.6 }}>
          touch the box to drop them — nothing autoplays here either
        </p>
      </div>
    </Page>
  );
}
