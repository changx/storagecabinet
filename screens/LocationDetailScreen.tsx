import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { StorageItem, StorageSpace } from '../types';
import { StorageManager } from '../utils/storage';

interface Props {
  navigation: any;
  route: {
    params: {
      spaceId: string;
      locationId: string;
      spaceTitle: string;
    };
  };
}

export default function LocationDetailScreen({ navigation, route }: Props) {
  const { spaceId, locationId, spaceTitle } = route.params;
  const [items, setItems] = useState<StorageItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadItems = async () => {
    try {
      setLoading(true);
      const storageManager = StorageManager.getInstance();
      const spaces = await storageManager.getStorageSpaces();
      const space = spaces.find(s => s.id === spaceId);
      
      if (space) {
        const location = space.locations.find(l => l.id === locationId);
        if (location) {
          setItems(location.items);
        }
      }
    } catch (error) {
      console.error('Error loading items:', error);
      Alert.alert('错误', '加载物品失败');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadItems();
    }, [])
  );

  const handleDeleteItem = (itemId: string) => {
    Alert.alert(
      '确认删除',
      '确定要删除这个物品吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: async () => {
            try {
              const storageManager = StorageManager.getInstance();
              await storageManager.deleteItem(spaceId, locationId, itemId);
              setItems(prev => prev.filter(item => item.id !== itemId));
            } catch (error) {
              console.error('Error deleting item:', error);
              Alert.alert('错误', '删除失败');
            }
          },
        },
      ]
    );
  };

  const handleEditItem = (item: StorageItem) => {
    navigation.navigate('EditItem', {
      spaceId,
      locationId,
      item,
    });
  };

  const handleAddItem = () => {
    navigation.navigate('EditItem', {
      spaceId,
      locationId,
      item: null,
    });
  };

  const renderItem = ({ item }: { item: StorageItem }) => (
    <View style={styles.itemContainer}>
      <TouchableOpacity 
        style={styles.itemContent}
        onPress={() => handleEditItem(item)}
      >
        <Image
          source={{ uri: item.photoPath }}
          style={styles.itemImage}
          resizeMode="cover"
        />
        <View style={styles.itemInfo}>
          <Text style={styles.itemDescription} numberOfLines={3}>
            {item.description}
          </Text>
          <Text style={styles.itemDate}>
            {new Date(item.updatedAt).toLocaleDateString('zh-CN')}
          </Text>
        </View>
      </TouchableOpacity>
      <View style={styles.itemActions}>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => handleEditItem(item)}
        >
          <Text style={styles.editButtonText}>编辑</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteItem(item.id)}
        >
          <Text style={styles.deleteButtonText}>删除</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <Text>加载中...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{spaceTitle} - 储物位置</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={handleAddItem}
        >
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      {items.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>这个位置还没有物品</Text>
          <TouchableOpacity style={styles.createButton} onPress={handleAddItem}>
            <Text style={styles.createButtonText}>添加第一个物品</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={items}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 5,
  },
  backButtonText: {
    color: '#007AFF',
    fontSize: 24,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 10,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 20,
  },
  createButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
  },
  createButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  listContainer: {
    padding: 15,
  },
  itemContainer: {
    backgroundColor: 'white',
    borderRadius: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    overflow: 'hidden',
  },
  itemContent: {
    flexDirection: 'row',
    padding: 15,
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 10,
    backgroundColor: '#f0f0f0',
  },
  itemInfo: {
    flex: 1,
    marginLeft: 15,
    justifyContent: 'space-between',
  },
  itemDescription: {
    fontSize: 16,
    color: '#333',
    lineHeight: 22,
  },
  itemDate: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  itemActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  editButton: {
    flex: 1,
    paddingVertical: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#f0f0f0',
  },
  editButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
    flex: 1,
    paddingVertical: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: '600',
  },
});