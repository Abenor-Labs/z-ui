'use client'

import { Disclosure } from './disclosure'

export default function DisclosureDemo() {
  return (
    <div className="w-full max-w-md divide-y divide-neutral-800 text-neutral-200">
      <Disclosure trigger="What happens if I click twice fast?">
        The height retargets mid-flight and keeps its velocity — try it while it's
        still opening.
      </Disclosure>
      <Disclosure trigger="Does it measure the content?" defaultOpen>
        Yes, from `scrollHeight`, with a `ResizeObserver` watching for later changes.
      </Disclosure>
      <Disclosure trigger="Is this an easing curve?">
        No — a spring, retargeted on every click, which is the entire point.
      </Disclosure>
    </div>
  )
}
