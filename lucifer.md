Našel jsem ji. Není to border ani background některého z hlavních bloků, ale
samostatný překryv přes celou stránku:

```html
<div class="🐟-stripes" aria-hidden="true"></div>
```

Má `position: fixed`, `z-index: 2000` a jeho `linear-gradient` maluje přesně
12 px modré vlevo a 12 px vpravo. Proto se tak blbě hledá při proklikávání
stylů jednotlivých prvků.

Pro úplné odstranění stačí:

```css
.🐟-stripes {
  background: none !important;
}
```

Pokud už máš `html` a `body` černé, po tomhle budou černé i oba kraje. Kdybys
je chtěl pojistit natvrdo:

```css
html,
body {
  background: #000 !important;
}

.🐟-stripes {
  background: none !important;
}
```

Takže žádná záhadná navy vrstva pod stránkou — je to dekorativní
`.🐟-stripes` overlay nad ní. A souhlasím, že u tmavého skinu je `#666` kolem
ikonky příjemnější než ostrá bílá.
