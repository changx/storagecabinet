import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import { StorageSpace, StorageSpaceMeta, StorageLocation, StorageItem, SearchResult } from '../types';

const STORAGE_SPACES_KEY = 'storage_spaces';

export class StorageManager {
  private static instance: StorageManager;
  
  static getInstance(): StorageManager {
    if (!StorageManager.instance) {
      StorageManager.instance = new StorageManager();
    }
    return StorageManager.instance;
  }

  async getStorageSpaces(): Promise<StorageSpace[]> {
    try {
      const spaces = await AsyncStorage.getItem(STORAGE_SPACES_KEY);
      return spaces ? JSON.parse(spaces) : [];
    } catch (error) {
      console.error('Error getting storage spaces:', error);
      return [];
    }
  }

  async getStorageSpace(spaceId: string): Promise<StorageSpace | null> {
    try {
      const spaces = await this.getStorageSpaces();
      return spaces.find(space => space.id === spaceId) || null;
    } catch (error) {
      console.error('Error getting storage space:', error);
      return null;
    }
  }

  async saveStorageSpace(space: StorageSpace): Promise<void> {
    try {
      const spaces = await this.getStorageSpaces();
      const existingIndex = spaces.findIndex(s => s.id === space.id);
      
      if (existingIndex >= 0) {
        spaces[existingIndex] = space;
      } else {
        spaces.push(space);
      }
      
      await AsyncStorage.setItem(STORAGE_SPACES_KEY, JSON.stringify(spaces));
    } catch (error) {
      console.error('Error saving storage space:', error);
      throw error;
    }
  }

  async deleteStorageSpace(spaceId: string): Promise<void> {
    try {
      const spaces = await this.getStorageSpaces();
      const spaceToDelete = spaces.find(s => s.id === spaceId);
      
      if (spaceToDelete) {
        // 删除相关的图片文件
        await this.deleteSpaceImages(spaceToDelete);
      }
      
      // 从存储中移除空间数据
      const filteredSpaces = spaces.filter(s => s.id !== spaceId);
      await AsyncStorage.setItem(STORAGE_SPACES_KEY, JSON.stringify(filteredSpaces));
    } catch (error) {
      console.error('Error deleting storage space:', error);
      throw error;
    }
  }

  private async deleteSpaceImages(space: StorageSpace): Promise<void> {
    try {
      // 删除储物空间的主照片
      if (space.photoPath) {
        await this.deleteImageFile(space.photoPath);
      }
      
      // 删除缩略图
      if (space.thumbnailPath && space.thumbnailPath !== space.photoPath) {
        await this.deleteImageFile(space.thumbnailPath);
      }
      
      // 删除所有储物位置的物品照片
      for (const location of space.locations) {
        for (const item of location.items) {
          if (item.photoPath) {
            await this.deleteImageFile(item.photoPath);
          }
        }
      }
    } catch (error) {
      console.error('Error deleting space images:', error);
      // 不抛出错误，因为主要的数据删除操作应该继续
    }
  }

  private async deleteImageFile(filePath: string): Promise<void> {
    try {
      const fileExists = await FileSystem.getInfoAsync(filePath);
      if (fileExists.exists) {
        await FileSystem.deleteAsync(filePath);
      }
    } catch (error) {
      console.error('Error deleting image file:', filePath, error);
      // 不抛出错误，继续删除其他文件
    }
  }

  async addLocationToSpace(spaceId: string, location: StorageLocation): Promise<void> {
    try {
      const spaces = await this.getStorageSpaces();
      const space = spaces.find(s => s.id === spaceId);
      
      if (space) {
        space.locations.push(location);
        await this.saveStorageSpace(space);
      }
    } catch (error) {
      console.error('Error adding location to space:', error);
      throw error;
    }
  }

  async deleteLocationFromSpace(spaceId: string, locationId: string): Promise<void> {
    try {
      const spaces = await this.getStorageSpaces();
      const space = spaces.find(s => s.id === spaceId);
      
      if (space) {
        const location = space.locations.find(l => l.id === locationId);
        
        // 删除位置中所有物品的图片文件
        if (location) {
          for (const item of location.items) {
            if (item.photoPath) {
              await this.deleteImageFile(item.photoPath);
            }
          }
        }
        
        // 从空间中移除该位置
        space.locations = space.locations.filter(l => l.id !== locationId);
        await this.saveStorageSpace(space);
      }
    } catch (error) {
      console.error('Error deleting location from space:', error);
      throw error;
    }
  }

  async addItemToLocation(spaceId: string, locationId: string, item: StorageItem): Promise<void> {
    try {
      const spaces = await this.getStorageSpaces();
      const space = spaces.find(s => s.id === spaceId);
      
      if (space) {
        const location = space.locations.find(l => l.id === locationId);
        if (location) {
          location.items.push(item);
          await this.saveStorageSpace(space);
        }
      }
    } catch (error) {
      console.error('Error adding item to location:', error);
      throw error;
    }
  }

  async updateItem(spaceId: string, locationId: string, itemId: string, item: StorageItem): Promise<void> {
    try {
      const spaces = await this.getStorageSpaces();
      const space = spaces.find(s => s.id === spaceId);
      
      if (space) {
        const location = space.locations.find(l => l.id === locationId);
        if (location) {
          const itemIndex = location.items.findIndex(i => i.id === itemId);
          if (itemIndex >= 0) {
            location.items[itemIndex] = item;
            await this.saveStorageSpace(space);
          }
        }
      }
    } catch (error) {
      console.error('Error updating item:', error);
      throw error;
    }
  }

  async deleteItem(spaceId: string, locationId: string, itemId: string): Promise<void> {
    try {
      const spaces = await this.getStorageSpaces();
      const space = spaces.find(s => s.id === spaceId);
      
      if (space) {
        const location = space.locations.find(l => l.id === locationId);
        if (location) {
          location.items = location.items.filter(i => i.id !== itemId);
          await this.saveStorageSpace(space);
        }
      }
    } catch (error) {
      console.error('Error deleting item:', error);
      throw error;
    }
  }

  async saveImageToLocal(uri: string, fileName: string): Promise<string> {
    try {
      const directory = FileSystem.documentDirectory + 'storage_images/';
      await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
      
      const newPath = directory + fileName;
      await FileSystem.copyAsync({
        from: uri,
        to: newPath
      });
      
      return newPath;
    } catch (error) {
      console.error('Error saving image:', error);
      throw error;
    }
  }

  async moveItem(
    fromSpaceId: string,
    fromLocationId: string,
    itemId: string,
    toSpaceId: string,
    toLocationId: string
  ): Promise<void> {
    try {
      const spaces = await this.getStorageSpaces();
      const fromSpace = spaces.find(s => s.id === fromSpaceId);
      const toSpace = spaces.find(s => s.id === toSpaceId);

      if (!fromSpace || !toSpace) {
        throw new Error('找不到源或目标储物空间');
      }

      const fromLocation = fromSpace.locations.find(l => l.id === fromLocationId);
      const toLocation = toSpace.locations.find(l => l.id === toLocationId);

      if (!fromLocation || !toLocation) {
        throw new Error('找不到源或目标储物位置');
      }

      const itemIndex = fromLocation.items.findIndex(i => i.id === itemId);
      if (itemIndex < 0) {
        throw new Error('找不到要移动的物品');
      }

      const item = fromLocation.items[itemIndex];
      
      // 如果移动到不同的储物空间，需要移动文件
      if (fromSpaceId !== toSpaceId && item.photoPath) {
        const oldPath = item.photoPath;
        const fileName = oldPath.split('/').pop() || `item_${itemId}.jpg`;
        const newPath = await this.saveImageToLocal(oldPath, `${toSpaceId}_${fileName}`);
        
        // 更新物品的图片路径
        item.photoPath = newPath;
        
        // 删除旧文件
        await this.deleteImageFile(oldPath);
      }

      // 更新物品的修改时间
      item.updatedAt = new Date().toISOString();

      // 从源位置移除物品
      fromLocation.items.splice(itemIndex, 1);

      // 添加到目标位置
      toLocation.items.push(item);

      // 保存两个储物空间的数据
      await this.saveStorageSpace(fromSpace);
      if (fromSpaceId !== toSpaceId) {
        await this.saveStorageSpace(toSpace);
      }
    } catch (error) {
      console.error('Error moving item:', error);
      throw error;
    }
  }

  async searchItems(query: string): Promise<SearchResult[]> {
    try {
      if (!query || query.trim().length === 0) {
        return [];
      }

      const spaces = await this.getStorageSpaces();
      const results: SearchResult[] = [];
      const normalizedQuery = query.toLowerCase().trim();

      for (const space of spaces) {
        for (const location of space.locations) {
          for (const item of location.items) {
            if (item.description.toLowerCase().includes(normalizedQuery)) {
              results.push({
                item,
                space,
                location
              });
            }
          }
        }
      }

      return results;
    } catch (error) {
      console.error('Error searching items:', error);
      return [];
    }
  }

  generateId(): string {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }
}