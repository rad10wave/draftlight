import { FurnitureCatalogItem, FurnitureLibraryExport } from '../types';
import { FURNITURE_CATALOG } from '../data/furnitureCatalog';

const CUSTOM_FURNITURE_KEY = 'draftlight_custom_furniture_catalog';

/**
 * Loads custom user furniture items from localStorage.
 */
export function loadCustomFurniture(): FurnitureCatalogItem[] {
  try {
    const raw = localStorage.getItem(CUSTOM_FURNITURE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch (e) {
    console.error('Failed to parse custom furniture from localStorage', e);
  }
  return [];
}

/**
 * Saves custom user furniture items to localStorage.
 */
export function saveCustomFurniture(items: FurnitureCatalogItem[]): void {
  try {
    localStorage.setItem(CUSTOM_FURNITURE_KEY, JSON.stringify(items));
  } catch (e) {
    console.error('Failed to save custom furniture to localStorage', e);
  }
}

/**
 * Returns merged furniture catalog (built-in presets + custom user items).
 */
export function getMergedFurnitureCatalog(): FurnitureCatalogItem[] {
  const custom = loadCustomFurniture();
  // Filter out any default items that might have been duplicated
  const customFiltered = custom.filter(
    (c) => !FURNITURE_CATALOG.some((d) => d.id === c.id)
  );
  return [...FURNITURE_CATALOG, ...customFiltered];
}

/**
 * Adds a new custom furniture item to the catalog.
 */
export function addCustomFurnitureItem(item: FurnitureCatalogItem): FurnitureCatalogItem[] {
  const current = loadCustomFurniture();
  const existingIdx = current.findIndex((c) => c.id === item.id);
  let updated: FurnitureCatalogItem[];
  if (existingIdx >= 0) {
    updated = [...current];
    updated[existingIdx] = item;
  } else {
    updated = [...current, item];
  }
  saveCustomFurniture(updated);
  return updated;
}

/**
 * Deletes a custom furniture item.
 */
export function deleteCustomFurnitureItem(id: string): FurnitureCatalogItem[] {
  const current = loadCustomFurniture();
  const updated = current.filter((c) => c.id !== id);
  saveCustomFurniture(updated);
  return updated;
}

/**
 * Exports custom furniture items into a standalone `.furniture.json` file format.
 */
export function exportFurnitureLibraryJson(
  itemsToExport?: FurnitureCatalogItem[],
  libraryName: string = 'My Architectural Furniture Library'
): string {
  const items = itemsToExport || loadCustomFurniture();
  const data: FurnitureLibraryExport = {
    version: '1.0',
    type: 'draftlight-furniture-library',
    exportedAt: new Date().toISOString(),
    name: libraryName,
    items,
  };
  return JSON.stringify(data, null, 2);
}

/**
 * Validates and imports a `.furniture.json` file.
 */
export function importFurnitureLibraryJson(jsonString: string): {
  success: boolean;
  importedCount: number;
  message: string;
  items?: FurnitureCatalogItem[];
} {
  try {
    const parsed = JSON.parse(jsonString);
    let candidateItems: any[] = [];

    if (parsed.type === 'draftlight-furniture-library' && Array.isArray(parsed.items)) {
      candidateItems = parsed.items;
    } else if (Array.isArray(parsed)) {
      candidateItems = parsed;
    } else if (parsed.items && Array.isArray(parsed.items)) {
      candidateItems = parsed.items;
    } else {
      return { success: false, importedCount: 0, message: 'Invalid furniture JSON structure.' };
    }

    const validatedItems: FurnitureCatalogItem[] = candidateItems
      .filter((item) => item && typeof item.name === 'string' && typeof item.width === 'number')
      .map((item) => ({
        id: item.id || `custom-furn-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name: String(item.name),
        category: (item.category || 'custom') as FurnitureCatalogItem['category'],
        width: Math.max(0.2, Number(item.width) || 1.0),
        depth: Math.max(0.2, Number(item.depth) || 1.0),
        height: Number(item.height) || 0.8,
        iconType: item.iconType || 'custom',
        color: item.color || '#475569',
        shapeType: item.shapeType || 'rectangle',
        description: item.description || '',
        author: item.author || 'Imported Asset',
        createdAt: item.createdAt || new Date().toISOString(),
      }));

    if (validatedItems.length === 0) {
      return { success: false, importedCount: 0, message: 'No valid furniture assets found in file.' };
    }

    const current = loadCustomFurniture();
    const map = new Map(current.map((c) => [c.id, c]));
    for (const val of validatedItems) {
      map.set(val.id, val);
    }
    const merged = Array.from(map.values());
    saveCustomFurniture(merged);

    return {
      success: true,
      importedCount: validatedItems.length,
      message: `Successfully imported ${validatedItems.length} furniture items.`,
      items: merged,
    };
  } catch (err: any) {
    return {
      success: false,
      importedCount: 0,
      message: err.message || 'Failed to parse JSON file.',
    };
  }
}
