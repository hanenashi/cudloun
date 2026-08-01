# Jak může Kapyguts pomoct Luciferovi se skinováním Kapybary

Kapyguts není další skin ani automatický editor CSS. Je to živá mapa měnícího
se DOMu Kapybary uvnitř Cudlounu. Pomáhá najít skutečné části stránky a používat
stabilnější selektory místo náhodně generovaných tříd typu `🇸-něco`, které se
mohou při dalším sestavení Kapybary změnit.

Cudloun lze nainstalovat kliknutím na
[cudloun.user.js](https://raw.githubusercontent.com/hanenashi/cudloun/main/cudloun.user.js).

## Nejrychlejší použití

V nástrojích pro vývojáře otevřít konzoli a zadat:

```js
const kg = Cudloun.kapyguts;

kg.inspect();
kg.pageHeaderParts();
kg.boardHeaderParts();
kg.pageChromeParts();
kg.visiblePosts();
kg.postParts(kg.visiblePosts()[0]);
```

Význam:

- `inspect()` vypíše stručný přehled právě otevřené stránky;
- `pageHeaderParts()` najde hlavní horní lištu;
- `boardHeaderParts()` najde záhlaví klubu a jeho ovládání;
- `pageChromeParts()` najde dekorace stránky včetně modrých krajních pruhů;
- `visiblePosts()` vrátí právě zobrazené příspěvky;
- `postParts(...)` rozebere příspěvek na avatar, hlavičku, autora, datum,
  tělo, odpověď a menu.

Elementy vypsané v konzoli jsou rozklikávací. Kliknutím se na ně dá skočit
přímo v inspectoru a zkoušet CSS bez dlouhého hledání ve stromu stránky.

## Co používat ve stylu

Pokud je to možné, používat sémantické části Kapybary:

```css
/* hlavní horní lišta */
header:not(.board-header):not(.post-header) {}

/* záhlaví klubu */
header.board-header {}

/* příspěvek, jeho hlavička a tělo */
article.post {}
article.post .post-header {}
article.post .body {}

/* nový příspěvek a jeho titulek */
section.new-post-composer {}
section.new-post-composer input[type="text"] {}
section.new-post-composer label:has(> input[type="text"]) > span {}
```

Vyhýbat se generovaným třídám `🇸-...`. Výjimkou je `.🐟-stripes`: jde o
skutečný prvek kreslící modré pásy na krajích viewportu a Kapyguts jej záměrně
mapuje přes `pageChromeParts()`.

## Proč se CSS z klasického Okouna v Kapybaře slije

U Luciferova příspěvku `1074681500` byl nalezen konkrétní důvod. Klasický Okoun
uložil označený blok jako:

```html
<div class="code">...</div>
```

Kapybara tento element zachová, ale jeho vypočtená hodnota `white-space` je
`normal`. Nevytvoří se `<pre>` ani `<code>`, takže prohlížeč vizuálně sloučí
řádky a odsazení. Není to chyba Luciferova CSS, ale kompatibilita starého
formátu příspěvku s novým rendererem.

Okamžitá lokální oprava:

```css
article.post .body > .code {
    display: block;
    padding: 10px 12px;
    overflow-x: auto;
    white-space: pre-wrap !important;
    tab-size: 4;
    background: #111;
    border: 1px solid #444;
    color: #ddd;
    font: 13px/1.45 ui-monospace, Consolas, monospace;
}
```

Minimální `white-space: pre-wrap` by ideálně měla doplnit přímo Kapybara,
protože problém se týká všech starších code bloků vložených přes klasický
Okoun.

## Poznámky k Luciferovu současnému CSS

Černooranžová varianta už vypadá dobře. Pro větší odolnost by šlo:

- změnit pevné `height: 24px` u `.post-header` na `min-height: 24px`, aby se
  neusekla delší metadata;
- omezit záporné okraje `-25px`, `-10px` a podobně, které mohou na mobilu
  překrýt sousední obsah;
- nahradit `div.body.🐟-content` stabilnějším `article.post .body`;
- nahradit `header.🐟-header` selektorem
  `header:not(.board-header):not(.post-header)`;
- počítat s tím, že `.post.unread.read` je přechodná kombinace stavových tříd
  a nemusí příspěvek označovat trvale.

## Možné další vylepšení Kapyguts

Užitečná budoucí funkce by byla:

```js
Cudloun.kapyguts.explain($0);
```

Po označení libovolného prvku inspectorem by mohla vrátit například:

```js
{
  component: "post body",
  recommendedSelector: "article.post .body",
  avoid: [".🐟-content", ".🇸-trfpop"],
  css: "article.post .body {\n  /* vlastní styl */\n}"
}
```

Tato funkce zatím v Kapyguts není. Smyslem by bylo zjednodušit celý postup na:
ukázat na problematický prvek, zavolat `explain($0)`, zkopírovat doporučený
selektor a pokračovat ve skinování.

## Krátká verze pro Lucifera

> Kapyguts je živá mapa Kapybary uvnitř Cudlounu. Skin za tebe nenapíše, ale
> nemusíš pokaždé lovit, pod jakou třídou je hlavička, příspěvek, avatar nebo
> modré okraje. V konzoli zkus `const kg = Cudloun.kapyguts`, potom
> `kg.inspect()` nebo `kg.postParts(kg.visiblePosts()[0])`. Vypsané elementy
> jsou rozklikávací přímo do inspectoru. Používej hlavně `.post`,
> `.post-header`, `.body`, `.composer` a vyhýbej se třídám `🇸-něco`.
