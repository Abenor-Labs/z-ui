import type { Metadata } from 'next'
import { components } from '@/__generated__/meta.js'
import { ComponentGallery } from '@/components/gallery/component-gallery'

export const metadata: Metadata = {
  title: 'Components',
  description:
    'Every component in the Z-UI registry, with the gesture that drives it, the states it exposes, and the spring it settles on.',
}

/**
 * The catalogue, back as a route.
 *
 * It was deleted along with the components it listed, and the nav label was
 * pointed at a `#components` section on the home page instead — which meant
 * "Components" scrolled you to a paragraph explaining that there were none.
 * That was the right call while the registry was empty and the wrong one the
 * moment it stopped being empty.
 *
 * Everything on this page is read from `__generated__/meta.js`, which
 * `scripts/build-registry.mjs` writes from the manifests. Nothing here is
 * typed by hand, so the page cannot list a component that is not published or
 * describe one in terms it does not actually declare.
 */
export default function ComponentsPage() {
  return (
    <main className="mx-auto max-w-[80rem] px-4 pb-24 md:px-16">
      <header className="pt-12">
        <span className="lbl">catalog</span>
        <h1 className="t-lg mt-4">
          {components.length === 0 ? 'Being rebuilt.' : 'The gallery.'}
        </h1>
        <p className="mt-3 max-w-[52ch] text-base text-muted">
          Every tile below is the real component, imported through the same specifier the CLI
          writes into your project. Hover one, press one — nothing here is a screenshot, and
          nothing is a re-implementation that can drift from the file you get.
        </p>
      </header>

      {components.length === 0 ? (
        // An empty grid is worse than an honest sentence. Rendered from the
        // same manifest as the gallery, so it disappears on its own the moment
        // a component is generated rather than needing to be remembered.
        <div className="mt-12 rounded-xl border border-dashed border-white/10 px-6 py-14 text-center">
          <p className="text-base text-ink">Nothing is published yet.</p>
          <p className="lbl mx-auto mt-2 max-w-md">
            the registry is empty on purpose · new designs in progress
          </p>
        </div>
      ) : (
        <ComponentGallery items={components} />
      )}

      {/* The manifest facts the tiles do not carry. They belong under the
          gallery rather than inside a card: a tile's job is to show the motion,
          and burying `states` in it would make the card taller than the demo it
          exists to frame. */}
      {components.length > 0 ? (
        <section className="pt-20">
          <div className="flex items-baseline justify-between border-b border-rule pb-3">
            <h2 className="text-base font-semibold tracking-tight">The contracts</h2>
            <span className="lbl">read from each component.json</span>
          </div>
          <div className="grid gap-4 pt-6 md:grid-cols-2">
            {components.map((c) => (
              <div key={c.name} className="rounded-xl border border-hair bg-panel p-5">
                <div className="flex items-baseline gap-3">
                  {/* The install name, which is what you actually type. Kept
                      next to the title because they differ, and the one the
                      CLI wants is the one that is easy to get wrong. */}
                  <h3 className="text-base font-semibold tracking-tight text-ink">{c.title}</h3>
                  <code className="font-mono text-xs text-muted">{c.name}</code>
                </div>

                <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-2 border-t border-hair pt-4">
                  <Fact label="gesture" value={c.gesture} />
                  <Fact label="spring" value={c.spring} />
                  <Fact label="category" value={c.category} />
                </dl>

                {/*
                  The states, spelled out rather than counted.
                  `data-state` is half of what a consumer styles against, and
                  "4 states" tells them nothing they can write a selector with.
                */}
                <div className="mt-4 flex flex-wrap items-center gap-1.5">
                  <span className="lbl mr-1">states</span>
                  {c.states.map((s) => (
                    <span
                      key={s}
                      className="rounded-lg border border-hair bg-panel-2 px-2 py-0.5 font-mono text-[0.6875rem] text-muted"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </main>
  )
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="lbl">{label}</dt>
      <dd className="mt-0.5 font-mono text-sm text-ink">{value}</dd>
    </div>
  )
}
