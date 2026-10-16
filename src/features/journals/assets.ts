/* Cover and page artwork. These are the same pictures briizOS uses on the
   Mac (src/assets/covers, src/assets/pages), resized for a phone screen.
   Journals store only the artwork's name, never a file path. */

const COVER_URLS = import.meta.glob('../../assets/journals/covers/*.webp', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>

const PAGE_URLS = import.meta.glob('../../assets/journals/pages/*.webp', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>

function toAssetMap(globbed: Record<string, string>) {
  const map: Record<string, string> = {}
  for (const [path, url] of Object.entries(globbed)) {
    const name = path.split('/').pop()?.replace(/\.webp$/i, '')
    if (name) map[name] = url
  }
  return map
}

const COVERS = toAssetMap(COVER_URLS)
const PAGES = toAssetMap(PAGE_URLS)

export const COVER_NAMES = Object.keys(COVERS).sort((a, b) => a.localeCompare(b))
export const PAGE_NAMES = Object.keys(PAGES).sort((a, b) => a.localeCompare(b))

export const DEFAULT_COVER = COVERS.Manuscript ? 'Manuscript' : COVER_NAMES[0] ?? ''
export const DEFAULT_PAGE = PAGES.Parchment ? 'Parchment' : PAGE_NAMES[0] ?? ''

export function coverUrl(name: string | null | undefined) {
  return name ? COVERS[name] : undefined
}

export function pageUrl(name: string | null | undefined) {
  return name ? PAGES[name] : undefined
}

/* The average color of each cover, used to tint its spine on the shelf. */
const COVER_TINTS: Record<string, string> = {
  'Ample Groves': '#53624d',
  Antiquesty: '#164069',
  'Black Leaf': '#26261f',
  'Blushflower-light': '#8a8984',
  Blushflower: '#2f2d2c',
  Bonnetshep: '#707050',
  Celebria: '#2a3726',
  'Coverboard-Light': '#45606b',
  Coverboard: '#233545',
  Crumberlain: '#171e23',
  'Davis Jones': '#5e5041',
  Diagrammical: '#7b7a78',
  Eurydice: '#7a4d31',
  'Fantasy Card': '#485455',
  Humanist: '#3c895e',
  Huntress: '#6b2725',
  Jane: '#7b7b7d',
  'Layer 15': '#393c35',
  Leathermeal: '#7e5a3e',
  'Magic Frame': '#313234',
  Manuscript: '#5a4535',
  Monstrosity: '#2d2b28',
  Office: '#6e7276',
  Pinkburst: '#a9708b',
  Plague: '#452929',
  'Red Glass': '#341f1e',
  Regalene: '#4f7561',
  Roseblush: '#6d1c1c',
  'Techno Card': '#708e8c',
  Timedoor: '#623b24',
  TrapperKeeper: '#8f8a7f',
  Twinkle: '#42574d',
}

export function coverTint(name: string | null | undefined) {
  if (name && COVER_TINTS[name]) return COVER_TINTS[name]
  if (name?.startsWith('riffmeister')) return '#703619'
  return '#4a3a40'
}

/* Friendly names for the pickers ("riffmeister_fantasy_book_…" → "Riffmeister"). */
export function artworkLabel(name: string) {
  if (name.startsWith('riffmeister')) return 'Riffmeister'
  return name.replace(/[-_]+/g, ' ')
}

/* Page styles dark enough that writing on them needs light ink. */
const DARK_PAGES = new Set(['Canival Theater', 'Graph-dark', 'Regal-black'])

export function pageIsDark(name: string | null | undefined) {
  return !!name && DARK_PAGES.has(name)
}
