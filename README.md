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
