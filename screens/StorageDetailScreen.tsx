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
import { StorageSpace, StorageLocation, StorageItem } from '../types';
import { StorageDetailScreenNavigationProp, StorageDetailScreenRouteProp } from '../types/navigation';
import { StorageManager } from '../utils/storage';

const { width, height } = Dimensions.get('window');

interface Props {
  navigation: StorageDetailScreenNavigationProp;
  route: StorageDetailScreenRouteProp;
}

interface EmptyItem {
  id: string;
  name: string;
  isEmpty: true;
}

type ListItem = StorageItem | EmptyItem;

export default function StorageDetailScreen({ navigation, route }: Props) {
  const { space: initialSpace } = route.params;
  const [currentSpace, setCurrentSpace] = useState<StorageSpace>(initialSpace);
  const [imageLayout, setImageLayout] = useState<{width: number, height: number, x: number, y: number}>({ width: 0, height: 0, x: 0, y: 0 });
  const [imageNaturalSize, setImageNaturalSize] = useState<{width: number, height: number}>({ width: 0, height: 0 });
  const [calculatedImageSize, setCalculatedImageSize] = useState<{width: number, height: number}>({ width: 0, height: 0 });

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

  // 处理图片布局变化
  const handleImageLayout = (event: any) => {
    const { x, y, width, height } = event.nativeEvent.layout;
    console.log('Image layout:', { x, y, width, height });
    setImageLayout({ x, y, width, height });
  };

  // 获取图片自然尺寸并计算合适的显示尺寸
  const handleImageLoad = (event: any) => {
    const { width: naturalWidth, height: naturalHeight } = event.nativeEvent.source;
    console.log('Image natural size:', { width: naturalWidth, height: naturalHeight });
    setImageNaturalSize({ width: naturalWidth, height: naturalHeight });

    // 计算合适的显示尺寸
    const containerWidth = width - 30; // 左右margin各15px
    const maxHeight = height * 0.5; // 最大高度为屏幕高度的50%
    
    const imageRatio = naturalWidth / naturalHeight;
    
    // 按容器宽度缩放
    let displayWidth = containerWidth;
    let displayHeight = containerWidth / imageRatio;
    
    // 如果高度超过最大值，按最大高度缩放
    if (displayHeight > maxHeight) {
      displayHeight = maxHeight;
      displayWidth = maxHeight * imageRatio;
    }
    
    console.log('Calculated image size:', { width: displayWidth, height: displayHeight });
    setCalculatedImageSize({ width: displayWidth, height: displayHeight });
  };

  // 获取图片显示信息
  const getImageDisplayInfo = () => {
    if (!calculatedImageSize.width || !calculatedImageSize.height || !imageLayout.width || !imageLayout.height) {
      return null;
    }

    // 图片在容器中居中显示时的偏移量
    const offsetX = imageLayout.x + (imageLayout.width - calculatedImageSize.width) / 2;
    const offsetY = imageLayout.y + (imageLayout.height - calculatedImageSize.height) / 2;

    return {
      displayWidth: calculatedImageSize.width,
      displayHeight: calculatedImageSize.height,
      offsetX,
      offsetY,
    };
  };

  // 渲染储物位置标记
  const renderLocationMarkers = () => {
    if (!calculatedImageSize.width || !calculatedImageSize.height) return null;

    return currentSpace.locations.map((location, index) => {
      // 将百分比坐标转换为实际像素位置
      const markerX = location.x * calculatedImageSize.width;
      const markerY = location.y * calculatedImageSize.height;
      
      console.log(`Marker ${index + 1} position:`, {
        locationPercent: { x: location.x, y: location.y },
        imageSize: calculatedImageSize,
        finalPosition: { x: markerX, y: markerY }
      });

      return (
        <TouchableOpacity
          key={location.id}
          style={[
            styles.locationMarker,
            {
              left: markerX - 20, // 标记宽度的一半
              top: markerY - 20,  // 标记高度的一半
            },
          ]}
          onPress={() => navigation.navigate('LocationDetail', {
            spaceId: currentSpace.id,
            locationId: location.id,
            spaceTitle: currentSpace.title,
          })}
          activeOpacity={0.7}
        >
          <View style={styles.markerCircle}>
            <Text style={styles.markerText}>{location.items.length}</Text>
          </View>
          <View style={styles.markerLabel}>
            <Text style={styles.markerLabelText}>储物位置 {index + 1}</Text>
          </View>
        </TouchableOpacity>
      );
    });
  };

  // 准备SectionList数据
  const prepareSectionData = () => {
    return currentSpace.locations.map((location, index) => ({
      title: `储物位置 ${index + 1}`,
      data: location.items.length > 0 ? location.items : [{ id: 'empty', name: '暂无物品', isEmpty: true } as EmptyItem],
      locationId: location.id,
    }));
  };

  // 渲染section header
  const renderSectionHeader = ({ section }: any) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{section.title}</Text>
      <Text style={styles.itemCount}>{section.data.filter((item: any) => !('isEmpty' in item)).length} 件物品</Text>
    </View>
  );

  // 渲染列表项
  const renderItem = ({ item, section }: any) => {
    if ('isEmpty' in item && item.isEmpty) {
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
          {('photoPath' in item && item.photoPath) ? (
            <Image source={{ uri: item.photoPath }} style={styles.itemImage} />
          ) : (
            <View style={styles.itemImagePlaceholder}>
              <Text style={styles.placeholderText}>📦</Text>
            </View>
          )}
        </View>
        <View style={styles.itemInfo}>
          <Text style={styles.itemName}>{item.name}</Text>
          {('description' in item && item.description) && (
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
            style={[
              styles.photoContainer,
              calculatedImageSize.width > 0 && calculatedImageSize.height > 0 && {
                width: calculatedImageSize.width,
                height: calculatedImageSize.height,
              }
            ]}
            onPress={() => navigation.navigate('PhotoFullscreen', { photoPath: currentSpace.photoPath, title: currentSpace.title, space: currentSpace })}
            activeOpacity={0.9}
          >
            <Image
              source={{ uri: currentSpace.photoPath }}
              style={[
                styles.photoImage,
                calculatedImageSize.width > 0 && calculatedImageSize.height > 0 && {
                  width: calculatedImageSize.width,
                  height: calculatedImageSize.height,
                }
              ]}
              resizeMode="cover"
              onLayout={handleImageLayout}
              onLoad={handleImageLoad}
            />
            {/* 储物位置标记覆盖层 */}
            {renderLocationMarkers()}
          </TouchableOpacity>
        </View>
        
        {/* 下半部分：储物位置和物品列表 */}
        <View style={styles.listSection}>
          {prepareSectionData().length > 0 ? (
            <SectionList<ListItem>
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
    backgroundColor: 'white',
    marginBottom: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoContainer: {
    margin: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    position: 'relative',
  },
  photoImage: {
    borderRadius: 12,
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
  locationMarker: {
    position: 'absolute',
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  markerCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  markerText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  markerLabel: {
    position: 'absolute',
    top: 45,
    left: -30,
    width: 100,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  markerLabelText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
  },
});