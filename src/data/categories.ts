import type { Category } from './types'

type Sub = { id: string; label: string; tags?: string[] }

function cat(
  id: string,
  label: string,
  shortLabel: string,
  extras: { rail?: boolean; curated?: boolean; sub?: Sub[] } = {},
): Category {
  return {
    id,
    slug: id,
    label,
    shortLabel,
    inDiscoverRail: extras.rail,
    inInterestCurated: extras.curated ?? extras.rail,
    subcategories: extras.sub ?? [],
  }
}

export const categories: Category[] = [
  cat('all', 'All', 'All', { rail: true }),
  cat('books', 'Books & Publications', 'Books', {
    rail: true,
    curated: true,
    sub: [
      { id: 'first-editions', label: 'First Editions', tags: ['Dust jacket', 'Signed'] },
      { id: 'antiquarian', label: 'Antiquarian Books' },
      { id: 'science-fiction', label: 'Science Fiction', tags: ['Paperback', 'Hardcover'] },
      { id: 'natural-history-books', label: 'Natural History' },
      { id: 'comics-pubs', label: 'Comics-related publications' },
      { id: 'magazines', label: 'Magazines' },
      { id: 'manuscripts', label: 'Manuscripts' },
    ],
  }),
  cat('coins', 'Coins & Currency', 'Coins', {
    rail: true,
    curated: true,
    sub: [
      { id: 'ancient', label: 'Ancient Coins' },
      { id: 'ottoman', label: 'Ottoman Coins', tags: ['Silver', '19th Century', 'Ottoman Empire'] },
      { id: 'world-coins', label: 'World Coins' },
      { id: 'banknotes', label: 'Banknotes' },
      { id: 'tokens', label: 'Tokens' },
      { id: 'medals', label: 'Medals' },
    ],
  }),
  cat('stamps', 'Stamps & Postal History', 'Stamps', {
    rail: true,
    curated: true,
    sub: [
      { id: 'postage', label: 'Postage Stamps' },
      { id: 'fdc', label: 'First Day Covers' },
      { id: 'postal-history', label: 'Postal History' },
      { id: 'revenue', label: 'Revenue Stamps' },
    ],
  }),
  cat('cards', 'Trading Cards', 'Cards', {
    rail: true,
    curated: true,
    sub: [
      { id: 'sports-cards', label: 'Sports Cards' },
      { id: 'tcg', label: 'TCG' },
      { id: 'entertainment-cards', label: 'Entertainment Cards' },
    ],
  }),
  cat('comics', 'Comics & Graphic Novels', 'Comics', {
    sub: [
      { id: 'golden-age', label: 'Golden Age' },
      { id: 'graphic-novels', label: 'Graphic Novels' },
    ],
  }),
  cat('art', 'Art', 'Art', {
    rail: true,
    curated: true,
    sub: [
      { id: 'works-on-paper', label: 'Works on Paper' },
      { id: 'prints', label: 'Prints' },
      { id: 'sculpture', label: 'Sculpture' },
    ],
  }),
  cat('photography', 'Photography', 'Photography', {
    sub: [
      { id: 'prints-photo', label: 'Photographic Prints' },
      { id: 'negatives', label: 'Negatives' },
    ],
  }),
  cat('cameras', 'Cameras', 'Cameras', {
    curated: true,
    sub: [
      { id: 'rangefinders', label: 'Rangefinders' },
      { id: 'slr', label: 'SLR' },
      { id: 'instant', label: 'Instant' },
    ],
  }),
  cat('music', 'Music & Records', 'Music', {
    curated: true,
    sub: [
      { id: 'vinyl', label: 'Vinyl Records' },
      { id: 'cassettes', label: 'Cassettes' },
      { id: 'cds', label: 'CDs' },
      { id: 'music-memorabilia', label: 'Music Memorabilia' },
    ],
  }),
  cat('movies', 'Movies & Media', 'Media', {
    sub: [
      { id: 'vhs', label: 'VHS' },
      { id: 'laserdisc', label: 'LaserDisc' },
      { id: 'posters', label: 'Posters' },
    ],
  }),
  cat('toys', 'Toys & Models', 'Toys', {
    curated: true,
    sub: [
      { id: 'action-figures', label: 'Action Figures' },
      { id: 'model-kits', label: 'Model Kits' },
    ],
  }),
  cat('games', 'Games', 'Games', {
    sub: [
      { id: 'board', label: 'Board Games' },
      { id: 'video-hardware', label: 'Game Hardware' },
    ],
  }),
  cat('watches', 'Watches & Clocks', 'Watches', {
    curated: true,
    sub: [
      { id: 'mechanical', label: 'Mechanical' },
      { id: 'quartz', label: 'Quartz' },
      { id: 'clocks', label: 'Clocks' },
    ],
  }),
  cat('jewelry', 'Jewelry', 'Jewelry'),
  cat('fashion', 'Fashion', 'Fashion', { sub: [{ id: 'vintage-fashion', label: 'Vintage Clothing' }] }),
  cat('sneakers', 'Sneakers', 'Sneakers'),
  cat('sports-memorabilia', 'Sports Memorabilia', 'Sports'),
  cat('historical-memorabilia', 'Historical Memorabilia', 'History'),
  cat('militaria', 'Militaria', 'Militaria'),
  cat('antiques', 'Antiques', 'Antiques', {
    curated: true,
    sub: [
      { id: 'furniture-antique', label: 'Antique Furniture' },
      { id: 'silver', label: 'Silver' },
      { id: 'decorative-arts', label: 'Decorative Arts' },
    ],
  }),
  cat('archaeology', 'Archaeology', 'Archaeology', {
    sub: [
      { id: 'artifacts', label: 'Artifacts' },
      { id: 'shards', label: 'Pottery & Shards' },
    ],
  }),
  cat('natural-history', 'Natural History', 'Nature', {
    curated: true,
    sub: [
      { id: 'fossils', label: 'Fossils', tags: ['Trilobites', 'Paleozoic'] },
      { id: 'minerals', label: 'Minerals' },
      { id: 'shells', label: 'Shells' },
      { id: 'insects', label: 'Insects' },
      { id: 'botanical', label: 'Botanical Specimens' },
    ],
  }),
  cat('fossils-minerals', 'Fossils & Minerals', 'Fossils'),
  cat('shells-marine', 'Shells & Marine Collectibles', 'Marine'),
  cat('insects', 'Insects & Entomology', 'Insects'),
  cat('plants', 'Plants & Herbarium', 'Herbarium'),
  cat('scientific', 'Scientific Instruments', 'Science'),
  cat('medical', 'Medical & Pharmaceutical Collectibles', 'Medical', {
    sub: [
      { id: 'medical-instruments', label: 'Medical Instruments' },
      { id: 'pharmacy', label: 'Pharmacy & Apothecary' },
      { id: 'medical-ephemera', label: 'Medical Ephemera' },
    ],
  }),
  cat('retro-tech', 'Retro Technology', 'Retro Tech', {
    rail: true,
    curated: true,
    sub: [
      { id: 'portable-audio', label: 'Portable Audio', tags: ['Sony', 'Walkman', '1980s'] },
      { id: 'vintage-computers', label: 'Vintage Computers' },
      { id: 'calculators', label: 'Calculators' },
      { id: 'game-hardware', label: 'Game Hardware' },
      { id: 'vintage-electronics', label: 'Vintage Electronics' },
    ],
  }),
  cat('computers', 'Computers', 'Computers'),
  cat('phones', 'Phones & Communication', 'Phones'),
  cat('audio', 'Audio Equipment', 'Audio'),
  cat('vehicles', 'Vehicles & Transportation', 'Vehicles'),
  cat('automobilia', 'Automobilia & Motoring Memorabilia', 'Automobilia', {
    sub: [
      { id: 'license-plates', label: 'License Plates' },
      { id: 'vehicle-badges', label: 'Vehicle Badges & Emblems' },
      { id: 'motoring-literature', label: 'Manuals & Motoring Literature' },
    ],
  }),
  cat('railway', 'Railway & Transit Memorabilia', 'Railway'),
  cat('aviation', 'Aviation & Space Memorabilia', 'Aviation'),
  cat('maritime', 'Maritime & Nautical Collectibles', 'Maritime'),
  cat('diecast', 'Die-cast Vehicles', 'Die-cast'),
  cat('ephemera', 'Documents & Ephemera', 'Ephemera'),
  cat('autographs', 'Autographs', 'Autographs'),
  cat('maps', 'Maps & Atlases', 'Maps'),
  cat('postcards', 'Postcards', 'Postcards'),
  cat('advertising', 'Advertising', 'Advertising'),
  cat('breweriana', 'Breweriana & Beverage Memorabilia', 'Breweriana'),
  cat('food-packaging', 'Food Packaging & Grocery Memorabilia', 'Packaging'),
  cat('bottles', 'Bottles & Packaging', 'Bottles'),
  cat('ceramics', 'Ceramics & Glass', 'Ceramics'),
  cat('furniture', 'Furniture & Design', 'Design'),
  cat('cultural', 'Cultural Objects', 'Culture'),
  cat('pins', 'Pins & Badges', 'Pins'),
  cat('keychains', 'Keychains', 'Keychains'),
  cat('miniatures', 'Miniatures', 'Miniatures'),
  cat('vaping', 'Electronic Cigarettes & Vaping Collectibles', 'Vaping', {
    sub: [
      { id: 'devices', label: 'Devices & Mods' },
      { id: 'atomizers', label: 'Atomizers & Accessories' },
    ],
  }),
  cat('tobacciana', 'Tobacco Memorabilia', 'Tobacciana', {
    sub: [
      { id: 'packs', label: 'Cigarette Packs' },
      { id: 'pipes', label: 'Pipes & Lighters' },
    ],
  }),
  cat('household', 'Household Objects & Appliances', 'Household'),
  cat('kitchenware', 'Kitchenware & Tableware', 'Kitchenware'),
  cat('tools', 'Tools & Hardware', 'Tools'),
  cat('pens', 'Pens & Writing Instruments', 'Pens'),
  cat('stationery', 'Stationery & Notebooks', 'Stationery'),
  cat('perfume', 'Perfume Bottles & Cosmetics Packaging', 'Perfume'),
  cat('textiles', 'Textiles & Handicrafts', 'Textiles'),
  cat('musical-instruments', 'Musical Instruments', 'Instruments'),
  cat('dolls', 'Dolls & Plush Toys', 'Dolls'),
  cat('holiday', 'Holiday & Seasonal Decorations', 'Decorations'),
  cat('tickets', 'Tickets & Travel Memorabilia', 'Tickets'),
  cat('awards', 'Awards & Trophies', 'Awards'),
  cat('religious', 'Religious & Ceremonial Objects', 'Ceremonial'),
  cat('other', 'Other', 'Other', { curated: true }),
]

export const discoverRail = categories.filter((category) => category.inDiscoverRail)
export const catalogCategories = categories.filter((category) => category.id !== 'all')
export const curatedInterestCategories = catalogCategories.filter((category) => category.inInterestCurated)

export function getCategory(id: string) {
  return categories.find((category) => category.id === id)
}

export function categoryLabel(id: string) {
  return getCategory(id)?.shortLabel ?? getCategory(id)?.label ?? 'Collection'
}

export function searchCategories(query: string) {
  const q = query.trim().toLowerCase()
  if (!q) {
    return catalogCategories
  }
  return catalogCategories.filter((category) => {
    const inName = `${category.label} ${category.shortLabel} ${category.slug}`.toLowerCase().includes(q)
    const inSubs = category.subcategories.some(
      (sub) => sub.label.toLowerCase().includes(q) || (sub.tags ?? []).some((tag) => tag.toLowerCase().includes(q)),
    )
    return inName || inSubs
  })
}

/** Singular and plural nouns; kept explicit for irregular and compound names. */
const collectibleNames: Record<string, [string, string]> = {
  books: ['book / publication', 'books / publications'],
  coins: ['coin / currency', 'coins / currency'],
  stamps: ['stamp / postal collectible', 'stamps / postal collectibles'],
  cards: ['trading card', 'trading cards'],
  comics: ['comic / graphic novel', 'comics / graphic novels'],
  art: ['artwork', 'artworks'],
  photography: ['photograph', 'photographs'],
  cameras: ['camera', 'cameras'],
  music: ['music collectible', 'music collectibles'],
  movies: ['film / media collectible', 'film / media collectibles'],
  toys: ['toy / model', 'toys / models'],
  games: ['game', 'games'],
  watches: ['watch / clock', 'watches / clocks'],
  jewelry: ['jewelry piece', 'jewelry pieces'],
  fashion: ['fashion piece', 'fashion pieces'],
  sneakers: ['pair of sneakers', 'pairs of sneakers'],
  'sports-memorabilia': ['sports collectible', 'sports collectibles'],
  'historical-memorabilia': ['historical collectible', 'historical collectibles'],
  militaria: ['military collectible', 'military collectibles'],
  antiques: ['antique', 'antiques'],
  archaeology: ['artifact', 'artifacts'],
  'natural-history': ['natural history specimen', 'natural history specimens'],
  'fossils-minerals': ['fossil / mineral', 'fossils / minerals'],
  'shells-marine': ['marine specimen', 'marine specimens'],
  insects: ['insect specimen', 'insect specimens'],
  plants: ['botanical specimen', 'botanical specimens'],
  scientific: ['scientific instrument', 'scientific instruments'],
  medical: ['medical / pharmaceutical collectible', 'medical / pharmaceutical collectibles'],
  'retro-tech': ['retro device', 'retro devices'],
  computers: ['computer', 'computers'],
  phones: ['communication device', 'communication devices'],
  audio: ['audio component', 'audio components'],
  vehicles: ['vehicle', 'vehicles'],
  automobilia: ['motoring collectible', 'motoring collectibles'],
  railway: ['railway / transit collectible', 'railway / transit collectibles'],
  aviation: ['aviation / space collectible', 'aviation / space collectibles'],
  maritime: ['maritime collectible', 'maritime collectibles'],
  diecast: ['die-cast vehicle', 'die-cast vehicles'],
  ephemera: ['document / ephemera', 'documents / ephemera'],
  autographs: ['autograph', 'autographs'],
  maps: ['map / atlas', 'maps / atlases'],
  postcards: ['postcard', 'postcards'],
  advertising: ['advertising collectible', 'advertising collectibles'],
  breweriana: ['beverage collectible', 'beverage collectibles'],
  'food-packaging': ['food packaging collectible', 'food packaging collectibles'],
  bottles: ['bottle / packaging', 'bottles / packaging'],
  ceramics: ['ceramic / glass piece', 'ceramic / glass pieces'],
  furniture: ['furniture / design piece', 'furniture / design pieces'],
  cultural: ['cultural collectible', 'cultural collectibles'],
  pins: ['pin / badge', 'pins / badges'],
  keychains: ['keychain', 'keychains'],
  miniatures: ['miniature', 'miniatures'],
  vaping: ['vaping device / accessory', 'vaping devices / accessories'],
  tobacciana: ['tobacco collectible', 'tobacco collectibles'],
  household: ['household collectible', 'household collectibles'],
  kitchenware: ['kitchen / tableware piece', 'kitchen / tableware pieces'],
  tools: ['tool', 'tools'],
  pens: ['writing instrument', 'writing instruments'],
  stationery: ['stationery collectible', 'stationery collectibles'],
  perfume: ['perfume / cosmetics collectible', 'perfume / cosmetics collectibles'],
  textiles: ['textile / handicraft', 'textiles / handicrafts'],
  'musical-instruments': ['musical instrument', 'musical instruments'],
  dolls: ['doll / plush toy', 'dolls / plush toys'],
  holiday: ['decoration', 'decorations'],
  tickets: ['ticket / travel collectible', 'tickets / travel collectibles'],
  awards: ['award / trophy', 'awards / trophies'],
  religious: ['ceremonial collectible', 'ceremonial collectibles'],
  other: ['collectible', 'collectibles'],
}

export function collectibleLabels(categoryId?: string, customName?: string) {
  const custom = categoryId === 'other' ? customName?.trim() : undefined
  // Do not guess English plurals for user-provided names in any language.
  if (custom) return { singular: `${custom} entry`, plural: `${custom} entries`, title: `${custom} — name` }
  const [singular, plural] = collectibleNames[categoryId ?? ''] ?? ['collectible', 'collectibles']
  const heading = singular.charAt(0).toUpperCase() + singular.slice(1)
  return {
    singular,
    plural,
    title: `${heading} ${categoryId === 'books' || categoryId === 'comics' ? 'title' : 'name'}`,
  }
}
