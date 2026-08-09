# @abenor/z-ui

Install Z-UI micro-interaction components as source you own.

There is no runtime package. `add` writes the component's `.tsx` into your
project and stops caring about it — you edit the spring, rewrite the markup,
delete half of it. Nothing upgrades behind you because there is nothing to
upgrade.

```sh
npx @abenor/z-ui init
npx @abenor/z-ui add disclosure
```

## Status

**The hosted registry is not live yet.** `init` writes a registry URL pointing
at `main`, and the components are not merged there, so `add` returns 404 against
the default. Everything works today against a clone:

```sh
git clone https://github.com/Abenor-Labs/z-ui
npx @abenor/z-ui init
npx @abenor/z-ui add disclosure --registry ./z-ui/registry
```

That path is not a workaround bolted on for the gap — `--registry` takes a URL
or a filesystem path by design, so contributors can install an uncommitted
component. It is how the test suite runs with no network at all.

## Commands

| | |
|---|---|
| `init` | write `z-ui.json` — where components, hooks and lib land, and under which import alias |
| `add <name...>` | add components and everything they depend on |
| `list` | what the registry offers, with each component's spring and state count |
| `doctor` | report what is installed and what drifted. Changes nothing |
| `spring [name]` | draw the actual curve in the terminal before you pick one |

Useful flags: `--dry-run` shows the plan and writes nothing, `--overwrite`
replaces files that already exist, `--spring <preset>` installs with a different
default, `--registry <url\|path>` points at somewhere other than the default.
`z-ui --help` has the rest.

## What lands

Whatever the manifest says and nothing else. Every file the CLI writes is
verified against the digest published alongside it, so a partial or tampered
download fails loudly instead of leaving you with half a component.

Components declare their npm dependencies; `add` installs those and touches
nothing else in `package.json`.

## Requires

Node 20.9 or newer.

MIT © Abenor Labs
