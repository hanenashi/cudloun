# cudloun

Babeta extensions framework for Okoun userscripts.

## Current shape

- `cudloun.user.js` is the installable seed userscript.
- `modules/core.js` boots the framework from GitHub raw URLs.
- `modules.json` lists system modules and feature modules.
- `modules/sys-logger.js` owns logging controls.
- `modules/sys-menu.js` owns the Babeta avatar menu and Cudloun hub.
- `modules/nepotrebny-pokus.js` is the first tiny feature module.

The seed loader fetches modules with a `?v=Date.now()` cache buster while the framework is under active development.

The first skeleton exposes a Cudloun entry in Babeta's avatar menu, opens a module hub, stores module enable switches in `localStorage`, includes a Debug view with recent logs, and has one tiny module that opens:

```text
https://babeta.okoun.cz/boards/nepotrebny_pokus
```
