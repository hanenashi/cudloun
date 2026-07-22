# Návrat do Oblíbených ztrácí pozici

TL;DR: je to reprodukovatelný race mezi SvelteKit obnovou scrollu a asynchronním
vykreslením seznamu Oblíbených, ne problém androidího tlačítka Zpět.

## Reprodukce

1. Otevřít `/fav/activity` a odrolovat níž, například na `scrollY = 2200`.
2. Otevřít klub, chvíli číst a použít systémové/prohlížečové Zpět.
3. Oblíbené se vrátí na `scrollY = 0`.

Stejně se chová `/fav/topics`; reprodukováno na mobilním i desktopovém Chromiu.

## Co se přesně děje

- Nejde o skutečný reload. Navigace zůstává ve stejné SPA stránce.
- Kapybara/SvelteKit používá `history.scrollRestoration = "manual"`.
- Původní pozice se uloží správně a při návratu skutečně proběhne
  `scrollTo(0, 2200)`.
- V tom okamžiku ale ještě není vykreslen žádný oblíbený klub, stránka má výšku
  pouze jednoho viewportu (`852 px`, `0` odkazů na kluby), takže prohlížeč
  požadovaných `2200 px` ořízne na nulu.
- Asi o `300–500 ms` později se objeví celý seznam (`79` klubů, výška
  `4693 px`), ale scroll už se znovu neobnoví.
- Konzole zůstává bez chyb.

Pebbleino odlišné chování může být závislé na cache/timingu nebo na tak krátkém
filtrovaném seznamu, že ztráta pozice není vidět.

## Možná oprava

Obnovit uložené `scrollY` až po načtení a vykreslení seznamu Oblíbených, případně
obnovu po dokončení renderu jednou zopakovat. Robustní podmínka je počkat, až je
seznam hotový a `document.documentElement.scrollHeight` dovoluje dosažení
uložené pozice; potom teprve volat `scrollTo(0, savedY)`.
