import { Reveal } from '@/components/reveal'

/**
 * One header shape for every section: an indexed eyebrow over a fading rule,
 * then the title and a single line of argument. Repeating it is what turns a
 * stack of blocks into a document with a spine.
 */
export function SectionHead({
  index,
  eyebrow,
  title,
  children,
}: {
  index: string
  eyebrow: string
  title: string
  children?: React.ReactNode
}) {
  return (
    <Reveal className="mb-12">
      <div className="mb-5 flex items-center gap-4">
        <span className="lbl">{index}</span>
        <span className="lbl">{eyebrow}</span>
        <span className="rule-fade min-w-0 flex-1" />
      </div>
      <h2 className="t-lg mb-3">{title}</h2>
      {children ? <div className="max-w-2xl text-base text-muted">{children}</div> : null}
    </Reveal>
  )
}
