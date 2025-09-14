import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Image,
  SectionList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { StorageSpace, StorageLocation } from '../types';
import { StorageDetailScreenNavigationProp, StorageDetailScreenRouteProp } from '../types/navigation';
import { StorageManager } from '../utils/storage';

const { width, height } = Dimensions.get('window');

interface Props {
  navigation: StorageDetailScreenNavigationProp;
  route: StorageDetailScreenRouteProp;
}

export default function StorageDetailScreen({ navigation, route }: Props) {
  const { space: initialSpace } = route.params;
  const [currentSpace, setCurrentSpace] = useState<StorageSpace>(initialSpace);

  // 刷新储物空间数据
  const refreshSpaceData = useCallback(async () => {
    try {
      const storageManager = StorageManager.getInstance();
      const updatedSpace = await storageManager.getStorageSpace(initialSpace.id);
      if (updatedSpace) {
        setCurrentSpace(updatedSpace);
      }
    } catch (error) {
      console.error('Error refreshing space data:', error);
    }
  }, [initialSpace.id]);

  // 页面获得焦点时刷新数据
  useFocusEffect(
    useCallback(() => {
      refreshSpaceData();
    }, [refreshSpaceData])
  );

  // 准备SectionList数据
  const prepareSectionData = () => {
    return currentSpace.locations.map(location => ({
      title: `储物位置 ${location.id.slice(-4)}`,
      data: location.items.length > 0 ? location.items : [{ id: 'empty', name: '暂无物品', isEmpty: true }],
      locationId: location.id,
    }));
  };

  // 渲染section header
  const renderSectionHeader = ({ section }: any) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{section.title}</Text>
      <Text style={styles.itemCount}>{section.data.filter((item: any) => !item.isEmpty).length} 件物品</Text>
    </View>
  );

  // 渲染列表项
  const renderItem = ({ item, section }: any) => {
    if (item.isEmpty) {
      return (
        <TouchableOpacity 
          style={styles.emptyItem}
          onPress={() => navigation.navigate('LocationDetail', {
            spaceId: currentSpace.id,
            locationId: section.locationId,
            spaceTitle: currentSpace.title,
          })}
        >
          <Text style={styles.emptyItemText}>+ 添加物品</Text>
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity 
        style={styles.listItem}
        onPress={() => navigation.navigate('LocationDetail', {
          spaceId: currentSpace.id,
          locationId: section.locationId,
          spaceTitle: currentSpace.title,
        })}
      >
        <View style={styles.itemImageContainer}>
          {item.photoPath ? (
            <Image source={{ uri: item.photoPath }} style={styles.itemImage} />
          ) : (
            <View style={styles.itemImagePlaceholder}>
              <Text style={styles.placeholderText}>📦</Text>
            </View>
          )}
        </View>
        <View style={styles.itemInfo}>
          <Text style={styles.itemName}>{item.name}</Text>
          {item.description && (
            <Text style={styles.itemDescription} numberOfLines={2}>{item.description}</Text>
          )}
        </View>
        <Text style={styles.arrow}>›</Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 头部导航 */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{currentSpace.title}</Text>
        <TouchableOpacity 
          style={styles.editButton}
          onPress={() => navigation.navigate('PhotoFullscreen', { photoPath: currentSpace.photoPath, title: currentSpace.title, space: currentSpace })}
        >
          <Text style={styles.editButtonText}>编辑</Text>
        </TouchableOpacity>
      </View>

      {/* 主要内容区 */}
      <View style={styles.content}>
        {/* 上半部分：照片 */}
        <View style={styles.photoSection}>
          <TouchableOpacity 
            style={styles.photoContainer}
            onPress={() => navigation.navigate('PhotoFullscreen', { photoPath: currentSpace.photoPath, title: currentSpace.title, space: currentSpace })}
            activeOpacity={0.9}
          >
            <Image
              source={{ uri: currentSpace.photoPath }}
              style={styles.photoImage}
              resizeMode="cover"
            />
          </TouchableOpacity>
        </View>
        
        {/* 下半部分：储物位置和物品列表 */}
        <View style={styles.listSection}>
          {prepareSectionData().length > 0 ? (
            <SectionList
              sections={prepareSectionData()}
              keyExtractor={(item) => item.id}
              renderItem={renderItem}
              renderSectionHeader={renderSectionHeader}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContainer}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>暂无储物位置</Text>
              <Text style={styles.emptySubText}>点击右上角"编辑"在照片上圈定储物区域</Text>
            </View>
          )}
        </View>
      </View>
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
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 8,
    minWidth: 44,
  },
  backButtonText: {
    color: '#007AFF',
    fontSize: 24,
    fontWeight: '300',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    flex: 1,
  },
  editButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#007AFF',
    borderRadius: 20,
    minWidth: 60,
    alignItems: 'center',
  },
  editButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  photoSection: {
    height: height * 0.3,
    backgroundColor: 'white',
    marginBottom: 10,
  },
  photoContainer: {
    flex: 1,
    margin: 15,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  listSection: {
    flex: 1,
    backgroundColor: 'white',
  },
  listContainer: {
    paddingTop: 15,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#f8f9fa',
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  itemCount: {
    fontSize: 14,
    color: '#666',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  itemImageContainer: {
    width: 50,
    height: 50,
    marginRight: 15,
  },
  itemImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
  },
  itemImagePlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 20,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  itemDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  arrow: {
    fontSize: 18,
    color: '#ccc',
  },
  emptyItem: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  emptyItemText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
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
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
});