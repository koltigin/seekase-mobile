# Seekase Category Icon System v1.0

Date: 2026-09-30  
Status: complete and integrated; 69/69 category/control icons validated in the signed Android build on a physical Seeker

## Scope

The current taxonomy contains:

- 68 catalog categories, including `Other`
- 70 defined subcategories across 22 parent categories
- One `All` browsing control, which is not a catalog category

The first production set therefore contains **68 category icons plus one `All` control icon**. Subcategories inherit their parent category icon in v1. A distinct subcategory icon is added only when usage and navigation density justify it; this avoids maintaining 139 unrelated pictograms as the open-ended taxonomy grows.

`src/data/categories.ts` remains the source of truth for names and IDs. This document defines visual meaning, not taxonomy.

## Visual grammar

- Canvas: `24 × 24`
- Standard stroke: `1.75`, round caps and joins
- Optical bounds: generally `3–21`
- Construction: one recognizable silhouette; no text, letters, flags or brand marks
- Default on dark: Warm Ivory `#F3EEE4`
- Inactive: theme `faint`; active: theme `ink`
- Clay Marker `#C47B6A`: selected/unread/status detail only, never baked into every icon
- Filled variants are not required; state is communicated by color and container treatment
- Icons must remain recognizable at 18 px and pass a final check at 16, 20, 24 and 32 px

Category icons identify a field of collecting, not ownership, authenticity, price or rarity. They must not resemble wallet, token, checkout or marketplace symbols.

## Production tiers

| Tier | Scope                           |       Count | Purpose                                      |
| ---- | ------------------------------- | ----------: | -------------------------------------------- |
| P0   | `All` + six Discover categories |           7 | Highest-visibility browsing controls         |
| P1   | Remaining curated interests     |           7 | Onboarding and prominent category surfaces   |
| P2   | Remaining catalog categories    |          55 | Full Collections catalog coverage            |
| P3   | Selected subcategory variants   | Initially 0 | Added from usage evidence, not pre-emptively |

P0 category IDs are `books`, `coins`, `stamps`, `cards`, `art`, and `retro-tech`, plus the `all` control. P1 adds `cameras`, `music`, `toys`, `watches`, `antiques`, `natural-history`, and `other`.

## Master inventory

| ID                       | UI label                                    | Master motif                                  | Subcategories in v1                                                                                                      |
| ------------------------ | ------------------------------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `all`                    | All                                         | four-object museum grid                       | —; browsing control only                                                                                                 |
| `books`                  | Books & Publications                        | closed book with visible spine                | First Editions; Antiquarian Books; Science Fiction; Natural History; Comics-related publications; Magazines; Manuscripts |
| `coins`                  | Coins & Currency                            | overlapping coin and banknote edge            | Ancient Coins; Ottoman Coins; World Coins; Banknotes; Tokens; Medals                                                     |
| `stamps`                 | Stamps & Postal History                     | perforated stamp                              | Postage Stamps; First Day Covers; Postal History; Revenue Stamps                                                         |
| `cards`                  | Trading Cards                               | two offset cards                              | Sports Cards; TCG; Entertainment Cards                                                                                   |
| `comics`                 | Comics & Graphic Novels                     | open panelled page                            | Golden Age; Graphic Novels                                                                                               |
| `art`                    | Art                                         | framed abstract composition                   | Works on Paper; Prints; Sculpture                                                                                        |
| `photography`            | Photography                                 | bordered photographic print                   | Photographic Prints; Negatives                                                                                           |
| `cameras`                | Cameras                                     | camera body and lens                          | Rangefinders; SLR; Instant                                                                                               |
| `music`                  | Music & Records                             | record with sleeve corner                     | Vinyl Records; Cassettes; CDs; Music Memorabilia                                                                         |
| `movies`                 | Movies & Media                              | film frame and play notch                     | VHS; LaserDisc; Posters                                                                                                  |
| `toys`                   | Toys & Models                               | simplified articulated figure                 | Action Figures; Model Kits                                                                                               |
| `games`                  | Games                                       | game piece on four-square board               | Board Games; Game Hardware                                                                                               |
| `watches`                | Watches & Clocks                            | round watch face and crown                    | Mechanical; Quartz; Clocks                                                                                               |
| `jewelry`                | Jewelry                                     | faceted ring                                  | —                                                                                                                        |
| `fashion`                | Fashion                                     | garment hanger                                | Vintage Clothing                                                                                                         |
| `sneakers`               | Sneakers                                    | side-profile sneaker                          | —                                                                                                                        |
| `sports-memorabilia`     | Sports Memorabilia                          | pennant and ball                              | —                                                                                                                        |
| `historical-memorabilia` | Historical Memorabilia                      | display plinth with document                  | —                                                                                                                        |
| `militaria`              | Militaria                                   | shield with restrained chevron                | —                                                                                                                        |
| `antiques`               | Antiques                                    | handled decorative vessel                     | Antique Furniture; Silver; Decorative Arts                                                                               |
| `archaeology`            | Archaeology                                 | pottery fragment profile                      | Artifacts; Pottery & Shards                                                                                              |
| `natural-history`        | Natural History                             | specimen leaf and small stone                 | Fossils; Minerals; Shells; Insects; Botanical Specimens                                                                  |
| `fossils-minerals`       | Fossils & Minerals                          | ammonite and crystal facet                    | —                                                                                                                        |
| `shells-marine`          | Shells & Marine Collectibles                | spiral shell                                  | —                                                                                                                        |
| `insects`                | Insects & Entomology                        | symmetrical beetle                            | —                                                                                                                        |
| `plants`                 | Plants & Herbarium                          | pressed leaf on sheet                         | —                                                                                                                        |
| `scientific`             | Scientific Instruments                      | instrument dial and pointer                   | —                                                                                                                        |
| `medical`                | Medical & Pharmaceutical Collectibles       | apothecary bottle                             | Medical Instruments; Pharmacy & Apothecary; Medical Ephemera                                                             |
| `retro-tech`             | Retro Technology                            | small CRT with control knob                   | Portable Audio; Vintage Computers; Calculators; Game Hardware; Vintage Electronics                                       |
| `computers`              | Computers                                   | desktop monitor and keyboard                  | —                                                                                                                        |
| `phones`                 | Phones & Communication                      | handset with signal line                      | —                                                                                                                        |
| `audio`                  | Audio Equipment                             | speaker cone and control                      | —                                                                                                                        |
| `vehicles`               | Vehicles & Transportation                   | simplified vehicle profile                    | —                                                                                                                        |
| `automobilia`            | Automobilia & Motoring Memorabilia          | road badge with steering wheel                | License Plates; Vehicle Badges & Emblems; Manuals & Motoring Literature                                                  |
| `railway`                | Railway & Transit Memorabilia               | front-facing rail car                         | —                                                                                                                        |
| `aviation`               | Aviation & Space Memorabilia                | aircraft/rocket ascent silhouette             | —                                                                                                                        |
| `maritime`               | Maritime & Nautical Collectibles            | ship wheel reduced to four spokes             | —                                                                                                                        |
| `diecast`                | Die-cast Vehicles                           | compact model car on base                     | —                                                                                                                        |
| `ephemera`               | Documents & Ephemera                        | stacked paper with folded corner              | —                                                                                                                        |
| `autographs`             | Autographs                                  | pen stroke over card                          | —                                                                                                                        |
| `maps`                   | Maps & Atlases                              | folded map with route                         | —                                                                                                                        |
| `postcards`              | Postcards                                   | landscape card with stamp corner              | —                                                                                                                        |
| `advertising`            | Advertising                                 | framed placard with small ray                 | —                                                                                                                        |
| `breweriana`             | Breweriana & Beverage Memorabilia           | capped bottle and coaster                     | —                                                                                                                        |
| `food-packaging`         | Food Packaging & Grocery Memorabilia        | upright carton/package                        | —                                                                                                                        |
| `bottles`                | Bottles & Packaging                         | two bottle silhouettes                        | —                                                                                                                        |
| `ceramics`               | Ceramics & Glass                            | cup and small vessel                          | —                                                                                                                        |
| `furniture`              | Furniture & Design                          | side-profile chair                            | —                                                                                                                        |
| `cultural`               | Cultural Objects                            | museum object on plinth                       | —                                                                                                                        |
| `pins`                   | Pins & Badges                               | round enamel pin with clasp cue               | —                                                                                                                        |
| `keychains`              | Keychains                                   | key ring with small tag                       | —                                                                                                                        |
| `miniatures`             | Miniatures                                  | tiny object beneath scale frame               | —                                                                                                                        |
| `vaping`                 | Electronic Cigarettes & Vaping Collectibles | device silhouette with detachable top         | Devices & Mods; Atomizers & Accessories                                                                                  |
| `tobacciana`             | Tobacco Memorabilia                         | vintage pack and unlit pipe; no smoke         | Cigarette Packs; Pipes & Lighters                                                                                        |
| `household`              | Household Objects & Appliances              | domestic appliance silhouette                 | —                                                                                                                        |
| `kitchenware`            | Kitchenware & Tableware                     | plate with fork profile                       | —                                                                                                                        |
| `tools`                  | Tools & Hardware                            | crossed wrench and short driver               | —                                                                                                                        |
| `pens`                   | Pens & Writing Instruments                  | fountain-pen nib                              | —                                                                                                                        |
| `stationery`             | Stationery & Notebooks                      | bound notebook with tab                       | —                                                                                                                        |
| `perfume`                | Perfume Bottles & Cosmetics Packaging       | stoppered perfume bottle                      | —                                                                                                                        |
| `textiles`               | Textiles & Handicrafts                      | folded textile with stitch line               | —                                                                                                                        |
| `musical-instruments`    | Musical Instruments                         | guitar body and neck                          | —                                                                                                                        |
| `dolls`                  | Dolls & Plush Toys                          | simplified teddy/doll head                    | —                                                                                                                        |
| `holiday`                | Holiday & Seasonal Decorations              | hanging ornament; season-neutral              | —                                                                                                                        |
| `tickets`                | Tickets & Travel Memorabilia                | perforated admission ticket                   | —                                                                                                                        |
| `awards`                 | Awards & Trophies                           | small trophy cup                              | —                                                                                                                        |
| `religious`              | Religious & Ceremonial Objects              | neutral ceremonial vessel with radiating mark | —                                                                                                                        |
| `other`                  | Other                                       | open display box with one object dot          | —; fallback for custom user category names                                                                               |

## Subcategory policy

Every existing subcategory has coverage through its parent icon. A future distinct subcategory variant must meet at least one of these conditions:

1. It appears as an independent filter or navigation destination.
2. Users routinely confuse it with sibling subcategories.
3. It has enough public collections to justify faster visual scanning.
4. Its parent icon would be materially misleading in that context.

When a variant is introduced, it keeps the parent's base geometry and changes one feature. Examples:

- `books` → First Editions: book + small `1`-free edition marker, such as one corner notch
- `coins` → Banknotes: retain circular coin cue beside a rectangular note
- `music` → Cassettes: retain sleeve proportions but replace the record circle with two reels
- `retro-tech` → Portable Audio: retain the CRT/control language but use a compact player and headphones
- `natural-history` → Fossils: retain the specimen frame and replace the leaf with an ammonite

Variants must never depend on tiny letters or numbers, because the production size is 18–24 px.

## File and component contract

Canonical vector sources should live under:

```text
assets/brand/icons/categories/<category-id>.svg
assets/brand/icons/categories/subcategories/<subcategory-id>.svg
```

Only approved P3 variants belong in the `subcategories` folder. Runtime lookup should always resolve in this order:

1. Approved subcategory icon, if present
2. Parent category icon
3. `other` fallback

The React Native component API should accept semantic IDs rather than filenames:

```tsx
<CategoryIcon categoryId="books" subcategoryId="first-editions" size={24} color={colors.ink} />
```

Unknown or user-authored category names resolve safely to `other`; they must never generate a dynamic asset path.

## Review checklist

- Compare the complete set at 18 px before approving detail.
- Check pairs likely to collide: Art/Photography, Retro Tech/Computers, Vehicles/Die-cast, Antiques/Furniture, Natural History/Fossils & Minerals.
- Check dark mode in default, inactive and selected states.
- Check monochrome reproduction; category icons do not require Clay Marker to remain legible.
- Check that culturally or religiously sensitive categories use neutral object-based symbols.
- Check that Vaping and Tobacciana remain archival/object-focused and do not depict use or smoke.
- Check TalkBack labels use category names; the icon itself is decorative when adjacent text is visible.
- Revalidate representative icons on a physical Seeker whenever stroke geometry, theme colors, or catalog row sizing changes.
