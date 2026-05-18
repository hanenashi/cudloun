// First tiny Cudloun module: open the shared Babeta test board.
(function () {
  "use strict";

  const root = window.Cudloun;

  root.registerModule({
    id: "nepotrebny-pokus",
    name: "Nepotrebny pokus",
    description: "Opens the shared Babeta test board in this tab.",
    version: "0.1.0",
    defaultEnabled: true,
    actionLabel: "Open board",
    action(ctx) {
      ctx.log.info("opening board");
      ctx.navigate("https://babeta.okoun.cz/boards/nepotrebny_pokus");
    },
    renderHelp() {
      return [
        "This is Cudloun's first small module.",
        "It proves that modules can register, show up in the hub, and perform an action.",
      ];
    },
  });
})();
