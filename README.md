# Z-UI

**Micro-animations you own.**

A copy-paste registry of spring-driven React components — installed as source into your project, not pulled in as a runtime dependency you can never change.

> **Status: pre-alpha.** Nothing is published yet. The CLI does not exist, the registry is empty, and everything below describes what is being built. Watch the repo if you want to know when that changes.

---

## What this is

Z-UI is **not** a general component library. It is a focused registry of *micro-interactions*: the small, tactile moments where an interface acknowledges you.

- **State-morphing controls** — play/pause, mute/unmute, lock/unlock
- **Tactile feedback** — like bounce, copy-to-clipboard checkmark draw, bookmark stretch
- **Input & utility magic** — password-visibility eye, expanding search pill, sun/moon theme switch

If it isn't a micro-animation, it doesn't belong here. That constraint is the product.

## What this is not

A design system. A layout kit. A replacement for shadcn/ui. Z-UI sits *on top of* whatever you already use.

---

## How it will work

```bash
npx @abenor/z-ui add like-button
```

The CLI resolves the component from the registry and writes the actual `.tsx` source into your project. From that moment it is your code — edit the spring, rewrite the markup, delete half of it. No upgrade path to fight, no wrapper API to reverse-engineer.

## Architecture decisions

These are locked. They shape everything else.

| Decision | Choice | Why |
| --- | --- | --- |
| **Motion engine** | [`motion`](https://motion.dev) (Framer Motion) as a declared dependency | Real interruptible springs with velocity carry-over. CSS keyframes cannot reverse mid-flight, and mid-flight reversal *is* the product. |
| **Delivery** | First-party CLI, `@abenor/z-ui` | Full control over install UX. Registry items stay shadcn-schema-shaped, so `npx shadcn add <url>` works as a free fallback. |
| **Registry transport** | Raw GitHub URLs, base URL as a single constant | No hosting to stand up on day one. Swaps to a domain later without a code change. |
| **Component API** | Uncontrolled by default, controlled optional | `<LikeButton />` works immediately; `pressed` / `onPressedChange` opt into control when a real app needs it. |

## Repository layout

```
z-ui/
├── registry/          source of truth — the components themselves
├── packages/cli/      @abenor/z-ui
└── web/               showcase
```

`registry/` is a real TypeScript workspace, not a folder of strings. Components typecheck in CI, so a broken one fails here instead of in someone else's project.

## Development

Requires Node >= 20 and pnpm.

```bash
pnpm install
pnpm typecheck
```

## License

MIT © Abenor Labs
