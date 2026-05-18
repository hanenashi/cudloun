# cudloun

Babeta extensions framework for Okoun userscripts.

Install:

https://raw.githubusercontent.com/hanenashi/cudloun/main/cudloun.user.js


## Current shape

- `cudloun.user.js` is the installable seed userscript.
- `modules/core.js` boots the framework from GitHub raw URLs.
- `modules.json` lists system modules and feature modules.
- `modules/sys-logger.js` owns logging controls.
- `modules/sys-menu.js` owns the Babeta avatar menu and Cudloun hub.
- `modules/containers.js` lists standalone live demos from `containers.json`.
- `modules/nepotrebny-pokus.js` is the first tiny feature module.
- `containers/` holds standalone tweak demos that can run from Cudloun or from a console loader.

The seed loader fetches modules with a `?v=Date.now()` cache buster while the framework is under active development.

The first skeleton exposes a Cudloun entry in Babeta's avatar menu, opens a module hub, stores module enable switches in `localStorage`, includes a Debug view with recent logs, and has one tiny module that opens:

```text
https://babeta.okoun.cz/boards/nepotrebny_pokus
```

## Containers

Containers are small standalone UI experiments. They are useful for trying a tweak on a live Babeta page before deciding whether it should become a full Cudloun module or an upstream Babeta change.

A container can be:

- run from the Cudloun `Containers` module
- stopped again from the same panel
- shared as a one-line console loader, so someone can preview the tweak without installing a userscript

The first container is `favorite-pill-colors`, which colors unread counters on:

```text
https://babeta.okoun.cz/favorites
```

Container files live in `containers/` and are listed in `containers.json`.
