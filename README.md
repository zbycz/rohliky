# Rohlik.cz — API poznámky

Neoficiální poznámky k (reverzně inženýrovanému) API Rohlik.cz a Rohlik Group.
Určeno pro osobní/studijní použití. **Není** to oficiální dokumentace — endpointy se
mohou kdykoliv změnit bez upozornění.

Používáním ber na vědomí Obchodní podmínky Rohlik.cz. Hromadné stahování katalogu
je nad rámec běžného používání e-shopu (u oficiálního MCP serveru je výslovně
vázané na předchozí písemný souhlas). Dávej pozor na rate-limiting.

## Webová aplikace

Statická jednostránková aplikace na `index.html` (bez buildstepu, čisté ES6
moduly, žádné závislosti): přihlášení do Rohlik.cz, oblíbené položky podle
kategorií, přepínač mřížka/tabulka, přidávání do košíku, dostupnost pro zvolenou
adresu a přehled košíku.

Běží na Cloudflare Pages: **https://rohliky.pages.dev**. Serverovou část (kvůli
CORS a cookies) řeší Pages Function na `/rohlik/*` na **stejné doméně**, takže
žádné CORS neexistuje. Adresa je zadrátovaná (konstanta `PROXY_PATH`
v `src/api/client.js`) a v UI se nenastavuje. Podrobnosti níže.

## Regiony

Základ je `https://www.rohlik.cz`; stejné API mají i další země Rohlik Group:

| Země | Base URL |
|---|---|
| 🇨🇿 Česko | `https://www.rohlik.cz` |
| 🇩🇪 Německo | `https://www.knuspr.de` |
| 🇦🇹 Rakousko | `https://www.gurkerl.at` |
| 🇭🇺 Maďarsko | `https://www.kifli.hu` |
| 🇷🇴 Rumunsko | `https://www.sezamo.ro` |

Ceny a dostupnost jsou vázané na **dodací adresu / session** (cookie). Anonymní
požadavky vrací generický sortiment (typicky Praha).

## Autentizace

Některé endpointy fungují bez přihlášení (kategorie, produktové karty), jiné
vyžadují session cookie z loginu (vyhledávání, košík, objednávky, účet).

```
POST /services/frontend-service/login      # body: e-mail + heslo → session cookie
POST /services/frontend-service/logout
```

- `GET  /api/v1/categories/{type}/subcategories` — **bez loginu** ✅
- `GET  /api/v1/categories/{type}/{id}/products` — **bez loginu** ✅
- `GET  /api/v1/products/card` — **bez loginu** ✅
- `GET  /services/frontend-service/search-metadata` — **vyžaduje login** ❌ (bez něj HTTP 400)

## Kategorie — strom

Ověřeno živě:

```bash
# Top-level kategorie (typ "normal" i "sales") → {"categoryIds":[...]}
GET /api/v1/categories/normal/subcategories
GET /api/v1/categories/sales/subcategories

# Podkategorie dané kategorie (rekurzivně)
GET /api/v1/categories/normal/{categoryId}/subcategories

# Metadata (name, slug, title, description, obrázky) pro dávku ID
GET /api/v1/categories?categories={id}&categories={id}&type=normal

# Kategorická hierarchie konkrétního produktu
GET /api/v1/products/{productId}/categories
```

Příklad `GET /api/v1/products/1462148/categories`:

```json
{"productId":1462148,"categories":[
 {"id":300105000,"type":"normal","name":"Mléčné a chlazené","slug":"mlecne-a-chlazene","level":0},
 {"id":300105048,"type":"normal","name":"Máslo, tuky a margaríny","slug":"maslo-tuky-a-margariny","level":1},
 {"id":300105049,"type":"normal","name":"Máslo","slug":"maslo","level":2}]}
```

Top-level (`normal/subcategories`) má 22 kategorií: Ovoce a zelenina, Mléčné a
chlazené, Maso a ryby, Pekárna a cukrárna, Uzeniny a lahůdky, Mražené, Trvanlivé,
Nápoje, Drogerie, Kosmetika, Dítě, Zvíře, Lékárna, Marks & Spencer, … Celý strom
se poskládá rekurzivním voláním `.../{id}/subcategories`.

## Produkty — výpis v kategorii

```bash
# 1) stránkovaný seznam ID (size max ~50)
GET /api/v1/categories/{type}/{categoryId}/products?page=0&size=50&sort={sort}&filter=&excludeProductIds=

# 2) dávka detailů (ceny, unitPrice), max ~50 ID na request
GET /api/v1/products/card?products={id}&products={id}&...&categoryType={type}
```

`sort` ∈ `recommended` | `price-asc` | `price-desc` | `unit-price-asc`

Odpověď kroku 1 obsahuje `productIds`, `productsWithType` a `pageable`, ale **ne**
totalCount → stránkuj, dokud `productIds` není prázdné.

Jednotlivé produkty:

```bash
GET /api/v1/products/{productId}              # plný detail
GET /api/v1/products/{productId}/prices       # aktuální ceny
GET /api/v1/products/{productId}/categories   # hierarchie kategorií
GET /api/v1/products/{productId}/composition  # složení / nutriční hodnoty
GET /api/v1/products/{productId}/ai-summary   # AI souhrn
```

## Vyhledávání (vyžaduje login)

```bash
GET /services/frontend-service/search-metadata
    ?search={dotaz}
    &offset=0
    &limit={n}
    &companyId=1
    &filterData={"filters":[]}
    &canCorrect=true
```

Vrací `data.productList`. Sponzorované výsledky mají badge se `slug == "promoted"`.

## Košík (vyžaduje login)

```bash
GET    /services/frontend-service/v2/cart          # obsah košíku + součty
POST   /services/frontend-service/v2/cart          # přidání: {productId, quantity, ...}
DELETE /services/frontend-service/v2/cart          # odebrání
```

## Objednávky (vyžaduje login)

```bash
GET /api/v3/orders/upcoming                        # naplánované objednávky
GET /api/v3/orders/delivered?offset=&limit=        # historie doručených
GET /api/v3/orders/{orderId}                       # detail objednávky
```

## Doručení (vyžaduje login)

```bash
GET /services/frontend-service/first-delivery?reasonableDeliveryTime=true
GET /services/frontend-service/timeslots-api/0?userId=&addressId=&reasonableDeliveryTime=true
GET /services/frontend-service/announcements/delivery
GET /services/frontend-service/announcements/top
GET /services/frontend-service/delivery-address/list
```

## Účet (vyžaduje login)

```bash
GET /services/frontend-service/premium/profile     # stav Xtra
GET /api/v1/reusable-bags/user-info                # vratné tašky
GET /api/v1/shopping-lists/id/{shoppingListId}     # nákupní seznam
```

## Slevy a akce

```bash
GET /api/v1/categories/sales/subcategories                 # ID akčních kategorií
GET /api/v1/categories/{saleType}/{categoryId}/products?... # saleType: sales|week-sales|multipack|bundles|premium-sales|favorite-sales
GET /api/v1/categories/sales/components/week-sales?page=&size=&sort=
```

## Ověřené příklady (bez loginu)

`GET /api/v1/categories/normal/300105049/products?...&sort=unit-price-asc` + karty:

```
Miil Máslo 82%                    unit=132.84 sale=33.21 orig=44.9 /kg
Miil Německé Máslo jemně kyselé   unit=161.64 sale=40.41 orig=44.9 /kg
Milko Máslo                       unit=219.6  sale=None  orig=54.9 /kg
Madeta Jihočeské máslo 82 %       unit=219.6  sale=None  orig=54.9 /kg
Dr. Halíř Máslo                   unit=247.2  sale=None  orig=30.9 /kg
```

## Skripty

- `rohlik_api_explore.py` — postaví strom kategorií (top-level + 1. úroveň dětí,
  uloží `rohlik_categories.json`) a vypíše produkty kategorie podle ceny za jednotku.

```bash
python3 rohlik_api_explore.py
```

## Zdroje / inspirace

- https://github.com/tomaspavlin/rohlik-mcp — TS MCP server (reverse-engineered API)
- https://github.com/dvejsada/rohlik_api_python — Python klient (`rohlik-api`)
- https://github.com/dvejsada/HA-RohlikCZ — Home Assistant integrace

## Aplikace — jak spustit

Appka běží na **https://rohliky.pages.dev**. Stačí se přihlásit e-mailem a
heslem — proxy na `/rohlik` je zadrátovaná a na stejné doméně (žádné CORS).
Alternativně lze do Nastavení vložit existující `PHPSESSION`
(DevTools → Application → Cookies → rohlik.cz).

### Nasazení (Cloudflare Pages, bez buildu)

Cloudflare dashboard → **Workers & Pages → Create → Pages → Connect to Git** →
repo `zbycz/rohliky`; Framework preset **None**, Build command prázdný,
Build output directory **`/`**. Adresář `functions/`
(`functions/rohlik/[[path]].js`) se nasadí automaticky a obsluhuje `/rohlik/*`.

### Alternativa: statika + samostatný Worker

Když nechceš Pages Functions, nasaď proxy jako Worker
(`cd proxy && npx wrangler deploy`) a v `src/api/client.js` přepiš `PROXY_PATH`
z `/rohlik` na plnou URL workeru (`https://rohlik-proxy.<ucet>.workers.dev`).
Worker posílá CORS hlavičky, protože v tu chvíli jde o cross-origin.

### Bez session

Bez přihlášení appka nic nezobrazí (oblíbené i košík vyžadují session).

### Co appka umí

- **nákupní seznam** (todo) nahoře: položky s libovolným textem a zaškrtávátkem,
  ovládané klávesnicí (Enter přidá pod aktuální, ↑/↓ pohyb mezi položkami,
  Shift+↑/↓ přesun, Backspace smaže prázdnou položku) a s rozbalitelnou tabulkou
  zboží z oblíbených u každé položky,
- oblíbené položky seskupené podle kategorií (kategorie se dotahují po produktech
  a kešují se),
- přepínač **mřížka / tabulka**,
- přidávání do košíku, změna množství a odebírání,
- dostupnost pro zvolenou adresu,
- položky v košíku, které nejsou v oblíbených, se zobrazí na konci sekce pod
  čarou, s tlačítkem ♥ pro přidání mezi oblíbené,
- vše (nastavení, adresa, tokeny, cache kategorií) v jediném klíči `rohliky`
  v localStorage.

### Architektura

```
index.html             kostra + <script type="module">
styles.css
src/index.js           bootstrap + re-render při změně storu
src/store.js           jediný klíč localStorage + runtime data + subscription
src/actions.js         orchestrace volání API a aktualizací storu
src/selectors.js       seskupení oblíbených podle kategorií + „extras“ z košíku
src/shopping.js        model nákupního seznamu (položky + přiřazené zboží)
src/api/client.js      fetch wrapper (proxy, X-Session, chyby)
src/api/rohlik.js      jednotlivé endpointy
src/lib/dom.js         mini vdom (h/render), bez závislostí
src/lib/format.js      ceny, dostupnost, formátování
src/lib/focus.js       obnova fokusu/karetu po re-renderu
src/components/*       App, Topbar, Login, Sections, Shopping, Product, CartPanel, Settings, Toasts
functions/rohlik/[[path]].js  Cloudflare Pages Function (same-origin proxy)
proxy/rohlik-proxy.js  samostatný Cloudflare Worker (stejná logika, CORS)
proxy/wrangler.toml    konfig pro `wrangler deploy` workeru
```

### Použité endpointy

- `POST /services/frontend-service/login` → nastaví `PHPSESSION`
- `GET  /api/v1/categories/favorite/products?page=&size=50&sort=recommended`
  - do `productIds` vkládá reklamní produktové karty; které to jsou, říká pole
    `interactiveProductCardAds` (jinak se v oblíbených objevují cizí produkty)
- `GET  /api/v1/products/card?products=&products=&categoryType=favorite`
- `GET  /api/v1/products/{id}/categories`
- `GET  /services/frontend-service/v2/cart`
- `POST /services/frontend-service/v2/cart?productId=` (`cartAddItemDTO`)
- `PUT  /services/frontend-service/v2/cart?orderFieldId=` (`cartUpdateItemDTO`)
- `DELETE /services/frontend-service/v2/cart?orderFieldId=`
- `POST /services/frontend-service/product/favourite` (`userFavouriteRequestDTO`)
- `GET  /services/frontend-service/delivery-address/list`
- `POST /services/frontend-service/delivery-zone/set` (`addressGeocodeDTO`)

