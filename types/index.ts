export interface StorageSpace {
  id: string;
  title: string;
  photoPath: string;
  thumbnailPath: string;
  locations: StorageLocation[];
}

export interface StorageLocation {
  id: string;
  x: number; // 位置标记的 x 坐标（相对于图片的百分比）
  y: number; // 位置标记的 y 坐标（相对于图片的百分比）
  items: StorageItem[];
}

export interface StorageItem {
  id: string;
  photoPath: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface StorageSpaceMeta {
  id: string;
  title: string;
  photoPath: string;
  thumbnailPath: string;
  locations: StorageLocation[];
  createdAt: string;
  updatedAt: string;
}