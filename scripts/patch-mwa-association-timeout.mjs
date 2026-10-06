import { readFile, writeFile } from 'node:fs/promises'

const modulePath = new URL(
  '../node_modules/@solana-mobile/mobile-wallet-adapter-protocol/android/src/main/java/com/solanamobile/mobilewalletadapter/reactnative/SolanaMobileWalletAdapterModule.kt',
  import.meta.url,
)

const original = 'private const val ASSOCIATION_TIMEOUT_MS = 10000'
const patched = 'private const val ASSOCIATION_TIMEOUT_MS = 30000'
const source = await readFile(modulePath, 'utf8')

if (source.includes(patched)) {
  console.log('MWA association timeout is already patched.')
} else if (source.includes(original)) {
  await writeFile(modulePath, source.replace(original, patched))
  console.log('Patched MWA association timeout to 30 seconds.')
} else {
  throw new Error('Could not find the expected MWA association timeout constant.')
}
