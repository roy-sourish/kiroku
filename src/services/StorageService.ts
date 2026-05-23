import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { Page } from "../types";

const DB_NAME = "kiroku-db";
const DB_VERSION = 1;

// Centralized storage keys (prevent typos)
const STORAGE_KEYS = {
  ALL_PAGES: "all-pages",
  LAST_ACTIVE_PAGE_ID: "lastActivePageId",

  // @NOTE: Future keys go here
  // ....
} as const;

interface KirokuDB extends DBSchema {
  pages: {
    key: string; // 'all-pages'
    value: Page[]; // array of pages
  };
  meta: {
    key: string; // 'lastActivePageId; etc.
    value: string; // Page ID or other metadata
  };
}

/**
 * Get or create the IndexedDB database instance
 * Creates object stores on first run or version upgrades
 * @returns 
 */
async function getDB(): Promise<IDBPDatabase<KirokuDB>> {
  return openDB<KirokuDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains("pages")) {
        db.createObjectStore("pages");
      }
      if (!db.objectStoreNames.contains("meta")) {
        db.createObjectStore("meta");
      }
    },
  });
}

/**
 * Save all pages to IndexedDB
 * @param pages - Array of pages to persist
 * @throws Error if storage fails
 */
export async function saveAll(pages: Page[]): Promise<void> {
  try {
    const db = await getDB();
    await db.put("pages", pages, STORAGE_KEYS.ALL_PAGES);
  } catch (error) {
    console.error("Failed to save pages to IndexedDB:", error);
    // Attach original error as the cause for better diagnostics
    throw new Error("Unable to save pages. Storage may be full or unavailable", {
      cause: error,
    });
  }
}

/**
 * Load all pages from IndexedDB
 * @returns Array of pages, or empty array if no data exists
 */
export async function loadAll(): Promise<Page[]> {
  try {
    const db = await getDB();
    const pages = await db.get("pages", STORAGE_KEYS.ALL_PAGES);
    // handle for first-time users
    return pages || [];
  } catch (error) {
    console.error("Failed to load pages from IndexedDB", error);

    // Graceful degradation: if IndexedDB fails we want the app to still work with empty state.
    // Users can create new pages.
    return [];
  }
}

/**
 * Get the ID of the last active page
 * @returns Page ID or null if not set
 */
export async function getLastActivePageId(): Promise<string | null> {
  try {
    const db = await getDB();
    const id = await db.get("meta", STORAGE_KEYS.LAST_ACTIVE_PAGE_ID);
    return id || null;
  } catch (error) {
    console.error("Failed to load last active page ID:", error);
    return null;
  }
}

/**
 * Save the ID of the current active page
 * @param id - Page ID to remember
 */
export async function setLastActivePageId(id: string): Promise<void> {
  try {
    const db = await getDB();
    await db.put("meta", id, STORAGE_KEYS.LAST_ACTIVE_PAGE_ID);
  } catch (error) {
    console.error("Failed to save last active page ID:", error);
    // No need to throw any error as this is non-critical metadata
    // app works fine without it
  }
}
