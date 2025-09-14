import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { StorageItem, StorageSpace, StorageLocation } from '../types';
import { LocationDetailScreenNavigationProp, LocationDetailScreenRouteProp } from '../types/navigation';
import { StorageManager } from '../utils/storage';

interface Props {
  navigation: LocationDetailScreenNavigationProp;
  route: LocationDetailScreenRouteProp;
}

export default function LocationDetailScreen({ navigation, route }: Props) {
  const { spaceId, locationId, spaceTitle } = route.params;
  const [items, setItems] = useState<StorageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<StorageItem | null>(null);
  const [allSpaces, setAllSpaces] = useState<StorageSpace[]>([]);
  const [selectedTargetSpace, setSelectedTargetSpace] = useState<StorageSpace | null>(null);
  const [selectedTargetLocation, setSelectedTargetLocation] = useState<StorageLocation | null>(null);

  const loadItems = async () => {
    try {
      setLoading(true);
      const storageManager = StorageManager.getInstance();
      const spaces = await storageManager.getStorageSpaces();
      setAllSpaces(spaces);
      
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

  const handleMoveItem = (item: StorageItem) => {
    setSelectedItem(item);
    setSelectedTargetSpace(null);
    setSelectedTargetLocation(null);
    setShowMoveModal(true);
  };

  const handleConfirmMove = async () => {
    if (!selectedItem || !selectedTargetSpace || !selectedTargetLocation) {
      Alert.alert('错误', '请选择目标储物空间和位置');
      return;
    }

    try {
      const storageManager = StorageManager.getInstance();
      await storageManager.moveItem(
        spaceId,
        locationId,
        selectedItem.id,
        selectedTargetSpace.id,
        selectedTargetLocation.id
      );

      // 更新本地物品列表
      setItems(prev => prev.filter(item => item.id !== selectedItem.id));
      
      setShowMoveModal(false);
      setSelectedItem(null);
      setSelectedTargetSpace(null);
      setSelectedTargetLocation(null);
      
      Alert.alert('成功', `物品已移动到 ${selectedTargetSpace.title}`);
    } catch (error) {
      console.error('Error moving item:', error);
      Alert.alert('错误', '移动物品失败，请稍后重试');
    }
  };

  const toggleEditMode = () => {
    setIsEditMode(!isEditMode);
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
        {isEditMode && (
          <TouchableOpacity
            style={styles.moveButton}
            onPress={() => handleMoveItem(item)}
          >
            <Text style={styles.moveButtonText}>移动</Text>
          </TouchableOpacity>
        )}
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
        <View style={styles.headerButtons}>
          <TouchableOpacity 
            style={styles.editModeButton}
            onPress={toggleEditMode}
          >
            <Text style={styles.editModeButtonText}>
              {isEditMode ? '完成' : '编辑'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={handleAddItem}
          >
            <Text style={styles.addButtonText}>+</Text>
          </TouchableOpacity>
        </View>
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

      {/* 移动物品模态框 */}
      <Modal
        visible={showMoveModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowMoveModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity 
              style={styles.modalCancelButton}
              onPress={() => setShowMoveModal(false)}
            >
              <Text style={styles.modalCancelButtonText}>取消</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>移动物品</Text>
            <TouchableOpacity 
              style={styles.modalConfirmButton}
              onPress={handleConfirmMove}
              disabled={!selectedTargetSpace || !selectedTargetLocation}
            >
              <Text style={[
                styles.modalConfirmButtonText,
                (!selectedTargetSpace || !selectedTargetLocation) && styles.modalConfirmButtonDisabled
              ]}>确定</Text>
            </TouchableOpacity>
          </View>

          {selectedItem && (
            <View style={styles.selectedItemInfo}>
              <Image
                source={{ uri: selectedItem.photoPath }}
                style={styles.selectedItemImage}
                resizeMode="cover"
              />
              <View style={styles.selectedItemText}>
                <Text style={styles.selectedItemTitle}>移动物品：</Text>
                <Text style={styles.selectedItemDescription} numberOfLines={2}>
                  {selectedItem.description}
                </Text>
              </View>
            </View>
          )}

          <Text style={styles.sectionTitle}>选择目标储物空间：</Text>
          <FlatList
            data={allSpaces}
            renderItem={({ item: space }) => (
              <TouchableOpacity
                style={[
                  styles.spaceOption,
                  selectedTargetSpace?.id === space.id && styles.spaceOptionSelected
                ]}
                onPress={() => {
                  setSelectedTargetSpace(space);
                  setSelectedTargetLocation(null);
                }}
              >
                <Text style={[
                  styles.spaceOptionText,
                  selectedTargetSpace?.id === space.id && styles.spaceOptionTextSelected
                ]}>{space.title}</Text>
                <Text style={styles.spaceOptionCount}>
                  {space.locations.length} 个位置
                </Text>
              </TouchableOpacity>
            )}
            keyExtractor={(item) => item.id}
            style={styles.spacesList}
          />

          {selectedTargetSpace && (
            <>
              <Text style={styles.sectionTitle}>选择目标储物位置：</Text>
              <FlatList
                data={selectedTargetSpace.locations}
                renderItem={({ item: location, index }) => (
                  <TouchableOpacity
                    style={[
                      styles.locationOption,
                      selectedTargetLocation?.id === location.id && styles.locationOptionSelected
                    ]}
                    onPress={() => setSelectedTargetLocation(location)}
                  >
                    <Text style={[
                      styles.locationOptionText,
                      selectedTargetLocation?.id === location.id && styles.locationOptionTextSelected
                    ]}>位置 {index + 1}</Text>
                    <Text style={styles.locationOptionCount}>
                      {location.items.length} 个物品
                    </Text>
                  </TouchableOpacity>
                )}
                keyExtractor={(item) => item.id}
                style={styles.locationsList}
              />
            </>
          )}
        </SafeAreaView>
      </Modal>
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
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  editModeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f0f0f0',
    borderRadius: 15,
    minWidth: 50,
    alignItems: 'center',
  },
  editModeButtonText: {
    color: '#333',
    fontSize: 14,
    fontWeight: '600',
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
  moveButton: {
    flex: 1,
    paddingVertical: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#f0f0f0',
  },
  moveButtonText: {
    color: '#FF9500',
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
  modalContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalCancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  modalCancelButtonText: {
    color: '#007AFF',
    fontSize: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    textAlign: 'center',
  },
  modalConfirmButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  modalConfirmButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalConfirmButtonDisabled: {
    color: '#999',
  },
  selectedItemInfo: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    margin: 15,
    padding: 15,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  selectedItemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  selectedItemText: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  selectedItemTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  selectedItemDescription: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 10,
  },
  spacesList: {
    maxHeight: 200,
  },
  spaceOption: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  spaceOptionSelected: {
    backgroundColor: '#e3f2fd',
  },
  spaceOptionText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  spaceOptionTextSelected: {
    color: '#007AFF',
    fontWeight: '600',
  },
  spaceOptionCount: {
    fontSize: 14,
    color: '#666',
  },
  locationsList: {
    maxHeight: 200,
  },
  locationOption: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  locationOptionSelected: {
    backgroundColor: '#e3f2fd',
  },
  locationOptionText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  locationOptionTextSelected: {
    color: '#007AFF',
    fontWeight: '600',
  },
  locationOptionCount: {
    fontSize: 14,
    color: '#666',
  },
});