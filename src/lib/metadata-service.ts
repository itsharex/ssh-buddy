/**
 * Metadata Service
 * Handles app-only metadata storage for host tags, favorites, and last-used timestamps.
 * Data is stored locally in the Tauri app data directory, separate from ~/.ssh/config.
 */

import {
  readTextFile,
  writeTextFile,
  exists,
  mkdir,
} from '@tauri-apps/plugin-fs'
import { appDataDir } from '@tauri-apps/api/path'

// Current schema version for migrations
const METADATA_SCHEMA_VERSION = 1

/**
 * Host metadata stored per-host by host alias
 */
export interface HostMetadata {
  tags: string[]
  isFavorite: boolean
  lastUsed?: number // Unix timestamp
  createdAt: number // Unix timestamp
  notes?: string
}

/**
 * App-level metadata (onboarding state, settings)
 */
export interface AppMetadata {
  onboardingCompleted: boolean
  onboardingSkipped: boolean
  firstRunAt?: number
}

/**
 * Full metadata file structure
 */
export interface MetadataStore {
  version: number
  hosts: Record<string, HostMetadata>
  tags: string[] // All unique tags for quick access
  app: AppMetadata
}

let metadataPath: string | null = null

/**
 * Get the metadata file path
 */
async function getMetadataPath(): Promise<string> {
  if (metadataPath) return metadataPath

  const appData = await appDataDir()
  // Ensure app data directory exists
  const dirExists = await exists(appData)
  if (!dirExists) {
    await mkdir(appData, { recursive: true })
  }

  metadataPath = `${appData}/metadata.json`
  return metadataPath
}

/**
 * Create default metadata store
 */
function createDefaultMetadata(): MetadataStore {
  return {
    version: METADATA_SCHEMA_VERSION,
    hosts: {},
    tags: [],
    app: {
      onboardingCompleted: false,
      onboardingSkipped: false,
    },
  }
}

/**
 * Read metadata from disk
 */
export async function readMetadata(): Promise<MetadataStore> {
  const path = await getMetadataPath()

  const fileExists = await exists(path)
  if (!fileExists) {
    return createDefaultMetadata()
  }

  try {
    const content = await readTextFile(path)
    const data = JSON.parse(content) as MetadataStore

    // Handle schema migrations if needed
    if (data.version < METADATA_SCHEMA_VERSION) {
      return migrateMetadata(data)
    }

    return data
  } catch {
    // If file is corrupted, return default
    console.warn('[metadata-service] Failed to parse metadata, using defaults')
    return createDefaultMetadata()
  }
}

/**
 * Write metadata to disk
 */
export async function writeMetadata(metadata: MetadataStore): Promise<void> {
  const path = await getMetadataPath()
  const content = JSON.stringify(metadata, null, 2)
  await writeTextFile(path, content)
}

/**
 * Handle schema migrations
 */
function migrateMetadata(data: MetadataStore): MetadataStore {
  // Future migrations would go here
  // For now, just update version
  return {
    ...data,
    version: METADATA_SCHEMA_VERSION,
  }
}

// ============================================
// Host Metadata Helpers
// ============================================

/**
 * Get metadata for a specific host
 */
export async function getHostMetadata(
  hostAlias: string
): Promise<HostMetadata | null> {
  const store = await readMetadata()
  return store.hosts[hostAlias] || null
}

/**
 * Set metadata for a host
 */
export async function setHostMetadata(
  hostAlias: string,
  metadata: Partial<HostMetadata>
): Promise<void> {
  const store = await readMetadata()

  const existing = store.hosts[hostAlias] || {
    tags: [],
    isFavorite: false,
    createdAt: Date.now(),
  }

  store.hosts[hostAlias] = {
    ...existing,
    ...metadata,
  }

  // Update global tags list
  updateGlobalTags(store)

  await writeMetadata(store)
}

/**
 * Add tags to a host
 */
export async function addHostTags(
  hostAlias: string,
  tags: string[]
): Promise<void> {
  const store = await readMetadata()

  const existing = store.hosts[hostAlias] || {
    tags: [],
    isFavorite: false,
    createdAt: Date.now(),
  }

  // Merge tags without duplicates
  const newTags = [...new Set([...existing.tags, ...tags])]

  store.hosts[hostAlias] = {
    ...existing,
    tags: newTags,
  }

  updateGlobalTags(store)
  await writeMetadata(store)
}

/**
 * Remove tags from a host
 */
export async function removeHostTags(
  hostAlias: string,
  tags: string[]
): Promise<void> {
  const store = await readMetadata()

  const existing = store.hosts[hostAlias]
  if (!existing) return

  existing.tags = existing.tags.filter((t) => !tags.includes(t))

  updateGlobalTags(store)
  await writeMetadata(store)
}

/**
 * Toggle favorite status
 */
export async function toggleHostFavorite(hostAlias: string): Promise<boolean> {
  const store = await readMetadata()

  const existing = store.hosts[hostAlias] || {
    tags: [],
    isFavorite: false,
    createdAt: Date.now(),
  }

  existing.isFavorite = !existing.isFavorite
  store.hosts[hostAlias] = existing

  await writeMetadata(store)
  return existing.isFavorite
}

/**
 * Update last-used timestamp
 */
export async function updateLastUsed(hostAlias: string): Promise<void> {
  const store = await readMetadata()

  const existing = store.hosts[hostAlias] || {
    tags: [],
    isFavorite: false,
    createdAt: Date.now(),
  }

  existing.lastUsed = Date.now()
  store.hosts[hostAlias] = existing

  await writeMetadata(store)
}

/**
 * Delete host metadata (call when host is removed from SSH config)
 */
export async function deleteHostMetadata(hostAlias: string): Promise<void> {
  const store = await readMetadata()

  delete store.hosts[hostAlias]
  updateGlobalTags(store)

  await writeMetadata(store)
}

/**
 * Rename host metadata (call when host alias changes)
 */
export async function renameHostMetadata(
  oldAlias: string,
  newAlias: string
): Promise<void> {
  const store = await readMetadata()

  const metadata = store.hosts[oldAlias]
  if (metadata) {
    store.hosts[newAlias] = metadata
    delete store.hosts[oldAlias]
    await writeMetadata(store)
  }
}

/**
 * Reconcile metadata with current SSH config hosts
 * Removes orphaned entries and logs warnings
 */
export async function reconcileMetadata(
  currentHostAliases: string[]
): Promise<string[]> {
  const store = await readMetadata()
  const orphaned: string[] = []

  for (const alias of Object.keys(store.hosts)) {
    if (!currentHostAliases.includes(alias)) {
      orphaned.push(alias)
    }
  }

  // Don't auto-delete orphans, just report them
  return orphaned
}

// ============================================
// Tag Helpers
// ============================================

/**
 * Get all unique tags across all hosts
 */
export async function getAllTags(): Promise<string[]> {
  const store = await readMetadata()
  return store.tags
}

/**
 * Create a new global tag
 */
export async function createTag(tag: string): Promise<void> {
  const store = await readMetadata()

  if (!store.tags.includes(tag)) {
    store.tags.push(tag)
    store.tags.sort()
    await writeMetadata(store)
  }
}

/**
 * Delete a tag from all hosts and global list
 */
export async function deleteTag(tag: string): Promise<void> {
  const store = await readMetadata()

  // Remove from all hosts
  for (const hostAlias of Object.keys(store.hosts)) {
    store.hosts[hostAlias].tags = store.hosts[hostAlias].tags.filter(
      (t) => t !== tag
    )
  }

  // Remove from global list
  store.tags = store.tags.filter((t) => t !== tag)

  await writeMetadata(store)
}

/**
 * Rename a tag across all hosts
 */
export async function renameTag(oldTag: string, newTag: string): Promise<void> {
  const store = await readMetadata()

  // Update in all hosts
  for (const hostAlias of Object.keys(store.hosts)) {
    const idx = store.hosts[hostAlias].tags.indexOf(oldTag)
    if (idx !== -1) {
      store.hosts[hostAlias].tags[idx] = newTag
    }
  }

  // Update global list
  const idx = store.tags.indexOf(oldTag)
  if (idx !== -1) {
    store.tags[idx] = newTag
    store.tags.sort()
  }

  await writeMetadata(store)
}

/**
 * Update global tags list from all host tags
 */
function updateGlobalTags(store: MetadataStore): void {
  const allTags = new Set<string>()

  for (const hostAlias of Object.keys(store.hosts)) {
    for (const tag of store.hosts[hostAlias].tags) {
      allTags.add(tag)
    }
  }

  store.tags = [...allTags].sort()
}

// ============================================
// App Metadata Helpers
// ============================================

/**
 * Get app metadata
 */
export async function getAppMetadata(): Promise<AppMetadata> {
  const store = await readMetadata()
  return store.app
}

/**
 * Update app metadata
 */
export async function updateAppMetadata(
  updates: Partial<AppMetadata>
): Promise<void> {
  const store = await readMetadata()

  store.app = {
    ...store.app,
    ...updates,
  }

  await writeMetadata(store)
}

/**
 * Mark onboarding as completed
 */
export async function completeOnboarding(): Promise<void> {
  await updateAppMetadata({ onboardingCompleted: true })
}

/**
 * Mark onboarding as skipped
 */
export async function skipOnboarding(): Promise<void> {
  await updateAppMetadata({ onboardingSkipped: true })
}

/**
 * Check if this is the first run
 */
export async function isFirstRun(): Promise<boolean> {
  const store = await readMetadata()
  return !store.app.onboardingCompleted && !store.app.onboardingSkipped
}

/**
 * Mark first run timestamp
 */
export async function markFirstRun(): Promise<void> {
  const store = await readMetadata()

  if (!store.app.firstRunAt) {
    store.app.firstRunAt = Date.now()
    await writeMetadata(store)
  }
}
