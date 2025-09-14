import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  GestureHandlerRootView, 
  GestureDetector, 
  Gesture 
} from 'react-native-gesture-handler';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSequence, 
  withTiming,
  runOnJS
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { StorageSpace, StorageLocation } from '../types';
import { StorageManager } from '../utils/storage';

const { width, height } = Dimensions.get('window');

interface Props {
  navigation: any;
  route: {
    params: {
      photoPath: string;
      title: string;
      space: StorageSpace;
    };
  };
}

interface LocationMarker {
  id: string;
  x: number;
  y: number;
  itemCount: number;
}

interface SelectionArea {
  startX: number;
  startY: number;
  width: number;
  height: number;
}

export default function PhotoFullscreenScreen({ navigation, route }: Props) {
  const { photoPath, title, space } = route.params;
  
  // 状态管理
  const [isEditMode, setIsEditMode] = useState(false);
  const [imageLayout, setImageLayout] = useState({ width: 0, height: 0, x: 0, y: 0 });
  const [selectedArea, setSelectedArea] = useState<SelectionArea | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [markers, setMarkers] = useState<LocationMarker[]>(
    space.locations.map(loc => ({
      id: loc.id,
      x: loc.x,
      y: loc.y,
      itemCount: loc.items.length,
    }))
  );

  // 动画值
  const buttonScale = useSharedValue(1);

  const handleImageLayout = (event: any) => {
    const { x, y, width, height } = event.nativeEvent.layout;
    console.log('Image layout:', { x, y, width, height });
    setImageLayout({ x, y, width, height });
  };

  // 模式切换
  const toggleEditMode = () => {
    console.log('Toggle edit mode clicked, current mode:', isEditMode);
    
    buttonScale.value = withSequence(
      withTiming(0.95, { duration: 100 }),
      withTiming(1, { duration: 100 })
    );
    
    setIsEditMode(!isEditMode);
    setSelectedArea(null);
    setIsSelecting(false);
    
    // 触觉反馈
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  // 创建新储物位置
  const handleCreateLocation = async (area: SelectionArea) => {
    try {
      const storageManager = StorageManager.getInstance();
      const locationId = storageManager.generateId();
      
      // 计算相对坐标（百分比）
      const relativeX = (area.startX + area.width / 2) / imageLayout.width;
      const relativeY = (area.startY + area.height / 2) / imageLayout.height;
      
      const newLocation: StorageLocation = {
        id: locationId,
        x: relativeX,
        y: relativeY,
        items: [],
      };

      await storageManager.addLocationToSpace(space.id, newLocation);
      
      const newMarker: LocationMarker = {
        id: locationId,
        x: relativeX,
        y: relativeY,
        itemCount: 0,
      };
      
      setMarkers(prev => [...prev, newMarker]);
      
      // 触觉反馈
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Error adding location:', error);
      Alert.alert('错误', '添加位置失败');
    }
  };

  // 手势处理
  const panGesture = Gesture.Pan()
    .enabled(isEditMode)
    .onStart((event) => {
      console.log('Pan gesture started, edit mode:', isEditMode, 'image layout:', imageLayout);
      if (!isEditMode || !imageLayout.width) return;
      
      runOnJS(setIsSelecting)(true);
      runOnJS(setSelectedArea)({
        startX: event.x - imageLayout.x,
        startY: event.y - imageLayout.y,
        width: 0,
        height: 0
      });
    })
    .onUpdate((event) => {
      if (!isEditMode || !isSelecting || !selectedArea) return;
      
      const currentX = event.x - imageLayout.x;
      const currentY = event.y - imageLayout.y;
      
      runOnJS(setSelectedArea)({
        startX: selectedArea.startX,
        startY: selectedArea.startY,
        width: currentX - selectedArea.startX,
        height: currentY - selectedArea.startY
      });
    })
    .onEnd(() => {
      console.log('Pan gesture ended, selected area:', selectedArea);
      if (!isEditMode || !selectedArea) return;
      
      // 检查选择区域是否有效（最小尺寸）
      const minSize = 20;
      if (Math.abs(selectedArea.width) > minSize && Math.abs(selectedArea.height) > minSize) {
        runOnJS(handleCreateLocation)(selectedArea);
      }
      
      runOnJS(setSelectedArea)(null);
      runOnJS(setIsSelecting)(false);
    });

  const handleMarkerPress = (marker: LocationMarker) => {
    if (isEditMode) {
      // 编辑模式下点击标记显示删除确认对话框
      handleDeleteLocation(marker);
      return;
    }
    
    navigation.navigate('LocationDetail', {
      spaceId: space.id,
      locationId: marker.id,
      spaceTitle: space.title,
    });
  };

  // 删除储物位置
  const handleDeleteLocation = (marker: LocationMarker) => {
    Alert.alert(
      '删除储物位置',
      `确定要删除这个储物位置吗？\n\n删除后将无法恢复，位置中的所有物品信息都将丢失。`,
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
              const storageManager = StorageManager.getInstance();
              await storageManager.deleteLocationFromSpace(space.id, marker.id);
              
              // 更新本地标记状态
              setMarkers(prev => prev.filter(m => m.id !== marker.id));
              
              // 触觉反馈
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              
              Alert.alert('成功', '储物位置已删除');
            } catch (error) {
              console.error('Error deleting location:', error);
              Alert.alert('错误', '删除储物位置失败，请稍后重试');
            }
          },
        },
      ]
    );
  };

  // 位置标记组件
  const renderMarker = (marker: LocationMarker) => {
    const markerX = marker.x * imageLayout.width;
    const markerY = marker.y * imageLayout.height;

    return (
      <TouchableOpacity
        key={marker.id}
        style={[
          styles.marker,
          {
            left: markerX + imageLayout.x - 20,
            top: markerY + imageLayout.y - 20,
            opacity: isEditMode ? 0.8 : 1.0,
          },
        ]}
        onPress={() => handleMarkerPress(marker)}
        activeOpacity={0.7}
      >
        <View style={styles.markerCircle}>
          <Text style={styles.markerText}>{marker.itemCount}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  // 选择框组件
  const renderSelectionOverlay = () => {
    if (!selectedArea || !isSelecting) return null;

    const left = Math.min(selectedArea.startX, selectedArea.startX + selectedArea.width);
    const top = Math.min(selectedArea.startY, selectedArea.startY + selectedArea.height);
    const width = Math.abs(selectedArea.width);
    const height = Math.abs(selectedArea.height);

    return (
      <View
        style={[
          styles.selectionBox,
          {
            left: left + imageLayout.x,
            top: top + imageLayout.y,
            width: width,
            height: height,
          }
        ]}
      />
    );
  };

  // 动画按钮样式
  const animatedButtonStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: buttonScale.value }],
    };
  });

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
          {/* 头部导航 */}
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => {
                console.log('Back button clicked');
                navigation.goBack();
              }}
            >
              <Text style={styles.backButtonText}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{title}</Text>
            <Animated.View style={animatedButtonStyle}>
              <TouchableOpacity 
                style={styles.editButton}
                onPress={toggleEditMode}
              >
                <Text style={styles.editButtonText}>
                  {isEditMode ? '完成' : '编辑'}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          </View>

          {/* 全屏照片 */}
          <GestureDetector gesture={panGesture}>
            <View style={styles.imageContainer}>
              <View style={styles.imageWrapper} onLayout={handleImageLayout}>
                <Image
                  source={{ uri: photoPath }}
                  style={styles.fullImage}
                  resizeMode="contain"
                />
                
                {/* 位置标记 */}
                {imageLayout.width > 0 && markers.map(renderMarker)}
                
                {/* 选择框覆盖层 */}
                {renderSelectionOverlay()}
              </View>
            </View>
          </GestureDetector>

          {/* 编辑模式提示 */}
          {isEditMode && (
            <View style={styles.editHint}>
              <Text style={styles.editHintText}>💡 滑动选择新的储物区域，点击已有标记可删除位置</Text>
            </View>
          )}
        </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    zIndex: 1000,
    elevation: 1000,
  },
  backButton: {
    padding: 8,
    minWidth: 44,
    alignItems: 'center',
  },
  backButtonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: '300',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: 'white',
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
    zIndex: 1001,
    elevation: 1001,
  },
  editButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  imageContainer: {
    flex: 1,
  },
  imageWrapper: {
    flex: 1,
    position: 'relative',
  },
  fullImage: {
    width: '100%',
    height: '100%',
  },
  marker: {
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
    fontSize: 14,
    fontWeight: 'bold',
  },
  selectionBox: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: '#007AFF',
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    borderStyle: 'dashed',
  },
  editHint: {
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  editHintText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.8,
  },
});