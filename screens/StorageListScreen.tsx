import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Dimensions,
  Image,
  ActionSheetIOS,
  Platform,
  TextInput,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { StorageSpace, SearchResult } from '../types';
import { StorageManager } from '../utils/storage';

const { width } = Dimensions.get('window');

interface Props {
  navigation: any;
}

export default function StorageListScreen({ navigation }: Props) {
  const [storageSpaces, setStorageSpaces] = useState<StorageSpace[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearchModalVisible, setIsSearchModalVisible] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [isRenameModalVisible, setIsRenameModalVisible] = useState(false);
  const [renameInput, setRenameInput] = useState('');
  const [selectedSpace, setSelectedSpace] = useState<StorageSpace | null>(null);

  const loadStorageSpaces = async () => {
    try {
      setLoading(true);
      const spaces = await StorageManager.getInstance().getStorageSpaces();
      setStorageSpaces(spaces);
    } catch (error) {
      console.error('Error loading storage spaces:', error);
      Alert.alert('错误', '加载储物空间失败');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadStorageSpaces();
    }, [])
  );

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.trim().length === 0) {
      setSearchResults([]);
      return;
    }

    try {
      setSearchLoading(true);
      const results = await StorageManager.getInstance().searchItems(query);
      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setSearchLoading(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setIsSearchModalVisible(false);
  };

  const navigateToLocationDetail = (result: SearchResult) => {
    setIsSearchModalVisible(false);
    navigation.navigate('LocationDetail', {
      spaceId: result.space.id,
      locationId: result.location.id,
      spaceTitle: result.space.title
    });
  };

  const renderSearchResult = ({ item }: { item: SearchResult }) => (
    <TouchableOpacity
      style={styles.searchResultItem}
      onPress={() => navigateToLocationDetail(item)}
    >
      <View style={styles.searchImageContainer}>
        <Image
          source={{ uri: item.item.photoPath }}
          style={styles.searchThumbnail}
          resizeMode="cover"
        />
      </View>
      <View style={styles.searchItemInfo}>
        <Text style={styles.searchItemTitle}>{item.item.description}</Text>
        <Text style={styles.searchItemLocation}>
          位置: {item.space.title}
        </Text>
        <Text style={styles.searchItemTime}>
          {new Date(item.item.createdAt).toLocaleDateString()}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderStorageSpace = ({ item }: { item: StorageSpace }) => (
    <TouchableOpacity
      style={styles.spaceItem}
      onPress={() => navigation.navigate('StorageDetail', { space: item })}
      onLongPress={() => showSpaceOptions(item)}
    >
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: item.thumbnailPath || item.photoPath }}
          style={styles.thumbnail}
          resizeMode="cover"
        />
        <TouchableOpacity 
          style={styles.optionsButton}
          onPress={() => showSpaceOptions(item)}
        >
          <Text style={styles.optionsButtonText}>⋯</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.titleContainer}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{item.title}</Text>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => openRenameModal(item)}
          >
            <Text style={styles.editButtonText}>编辑</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.locationCount}>
          {item.locations.length} 个位置
        </Text>
      </View>
    </TouchableOpacity>
  );

  const handleAddSpace = () => {
    navigation.navigate('AddStorageSpace');
  };

  const openRenameModal = (space: StorageSpace) => {
    setSelectedSpace(space);
    setRenameInput(space.title);
    setIsRenameModalVisible(true);
  };

  const closeRenameModal = () => {
    setIsRenameModalVisible(false);
    setSelectedSpace(null);
    setRenameInput('');
  };

  const submitRename = async () => {
    const newTitle = renameInput.trim();
    if (!selectedSpace) return;
    if (newTitle.length === 0) {
      Alert.alert('提示', '名称不能为空');
      return;
    }
    try {
      const updated: StorageSpace = { ...selectedSpace, title: newTitle };
      await StorageManager.getInstance().saveStorageSpace(updated);
      closeRenameModal();
      await loadStorageSpaces();
      Alert.alert('成功', '名称已更新');
    } catch (err) {
      console.error('Rename error:', err);
      Alert.alert('错误', '更新名称失败');
    }
  };

  const handleDeleteSpace = async (space: StorageSpace) => {
    Alert.alert(
      '删除储物空间',
      `确定要删除"${space.title}"吗？\n\n删除后将无法恢复，所有储物位置和物品信息都将丢失。`,
      [
        {
          text: '取消',
          style: 'cancel',
        },
        {
          text: '删除',
          style: 'destructive',
          onPress: async () => {
            try {
              await StorageManager.getInstance().deleteStorageSpace(space.id);
              await loadStorageSpaces(); // 重新加载列表
              Alert.alert('成功', `"${space.title}"已删除`);
            } catch (error) {
              console.error('Error deleting space:', error);
              Alert.alert('错误', '删除储物空间失败，请稍后重试');
            }
          },
        },
      ]
    );
  };

  const showSpaceOptions = (space: StorageSpace) => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['取消', '查看详情', '删除'],
          destructiveButtonIndex: 2,
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          switch (buttonIndex) {
            case 1:
              navigation.navigate('StorageDetail', { space });
              break;
            case 2:
              handleDeleteSpace(space);
              break;
          }
        }
      );
    } else {
      // Android 使用 Alert 实现选项菜单
      Alert.alert(
        space.title,
        '选择操作',
        [
          {
            text: '取消',
            style: 'cancel',
          },
          {
            text: '查看详情',
            onPress: () => navigation.navigate('StorageDetail', { space }),
          },
          {
            text: '删除',
            style: 'destructive',
            onPress: () => handleDeleteSpace(space),
          },
        ]
      );
    }
  };

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
        <Text style={styles.headerTitle}>储物空间</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity 
            style={styles.searchButton} 
            onPress={() => setIsSearchModalVisible(true)}
          >
            <Text style={styles.searchButtonText}>🔍</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.addButton} onPress={handleAddSpace}>
            <Text style={styles.addButtonText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      {storageSpaces.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>还没有储物空间</Text>
          <TouchableOpacity style={styles.createButton} onPress={handleAddSpace}>
            <Text style={styles.createButtonText}>创建第一个储物空间</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={storageSpaces}
          renderItem={renderStorageSpace}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          numColumns={1}
        />
      )}

      <Modal
        visible={isSearchModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={clearSearch}
      >
        <SafeAreaView style={styles.searchModalContainer}>
          <View style={styles.searchHeader}>
            <View style={styles.searchInputContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="搜索物品名称..."
                placeholderTextColor="#999"
                value={searchQuery}
                onChangeText={handleSearch}
                autoFocus={true}
                clearButtonMode="while-editing"
              />
            </View>
            <TouchableOpacity style={styles.cancelButton} onPress={clearSearch}>
              <Text style={styles.cancelButtonText}>取消</Text>
            </TouchableOpacity>
          </View>

          {searchLoading ? (
            <View style={styles.searchLoadingContainer}>
              <Text>搜索中...</Text>
            </View>
          ) : searchQuery.trim().length === 0 ? (
            <View style={styles.searchEmptyContainer}>
              <Text style={styles.searchEmptyText}>输入物品名称开始搜索</Text>
            </View>
          ) : searchResults.length === 0 ? (
            <View style={styles.searchEmptyContainer}>
              <Text style={styles.searchEmptyText}>未找到相关物品</Text>
            </View>
          ) : (
            <FlatList
              data={searchResults}
              renderItem={renderSearchResult}
              keyExtractor={(item, index) => `${item.item.id}_${index}`}
              contentContainerStyle={styles.searchResultsList}
            />
          )}
        </SafeAreaView>
      </Modal>

      <Modal
        visible={isRenameModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closeRenameModal}
      >
        <View style={styles.renameOverlay}>
          <View style={styles.renameContainer}>
            <Text style={styles.renameTitle}>修改名称</Text>
            <TextInput
              style={styles.renameInput}
              value={renameInput}
              onChangeText={setRenameInput}
              placeholder="请输入新的名称"
              placeholderTextColor="#999"
              autoFocus
            />
            <View style={styles.renameActions}>
              <TouchableOpacity style={styles.renameCancel} onPress={closeRenameModal}>
                <Text style={styles.renameCancelText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.renameConfirm} onPress={submitRename}>
                <Text style={styles.renameConfirmText}>保存</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
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
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchButtonText: {
    fontSize: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
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
  spaceItem: {
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
  imageContainer: {
    width: '100%',
    height: 200,
    backgroundColor: '#f0f0f0',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  titleContainer: {
    padding: 15,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  editButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  editButtonText: {
    color: '#333',
    fontSize: 14,
  },
  locationCount: {
    fontSize: 14,
    color: '#666',
  },
  optionsButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionsButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  searchModalContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    gap: 10,
  },
  searchInputContainer: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    paddingHorizontal: 15,
    height: 40,
    justifyContent: 'center',
  },
  searchInput: {
    fontSize: 16,
    color: '#333',
  },
  cancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  cancelButtonText: {
    color: '#007AFF',
    fontSize: 16,
  },
  searchLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchEmptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  searchEmptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  searchResultsList: {
    padding: 15,
  },
  searchResultItem: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchImageContainer: {
    width: 80,
    height: 80,
    backgroundColor: '#f0f0f0',
  },
  searchThumbnail: {
    width: '100%',
    height: '100%',
  },
  searchItemInfo: {
    flex: 1,
    padding: 15,
  },
  searchItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  searchItemLocation: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  searchItemTime: {
    fontSize: 12,
    color: '#999',
  },
  renameOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  renameContainer: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  renameTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  renameInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#333',
    marginBottom: 12,
    backgroundColor: '#fafafa',
  },
  renameActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  renameCancel: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  renameCancelText: {
    color: '#007AFF',
    fontSize: 16,
  },
  renameConfirm: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  renameConfirmText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
