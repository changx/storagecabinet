import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  PanGestureHandler,
  Dimensions,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GestureHandlerRootView, State } from 'react-native-gesture-handler';
import { StorageSpace, StorageLocation } from '../types';
import { StorageManager } from '../utils/storage';

const { width, height } = Dimensions.get('window');

interface Props {
  navigation: any;
  route: {
    params: {
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

export default function StorageDetailScreen({ navigation, route }: Props) {
  const { space } = route.params;
  const [imageLayout, setImageLayout] = useState({ width: 0, height: 0, x: 0, y: 0 });
  const [markers, setMarkers] = useState<LocationMarker[]>(
    space.locations.map(loc => ({
      id: loc.id,
      x: loc.x,
      y: loc.y,
      itemCount: loc.items.length,
    }))
  );

  const handleImageLayout = (event: any) => {
    const { x, y, width, height } = event.nativeEvent.layout;
    setImageLayout({ x, y, width, height });
  };

  const handleTap = async (event: any) => {
    const { absoluteX, absoluteY } = event.nativeEvent;
    
    const relativeX = (absoluteX - imageLayout.x) / imageLayout.width;
    const relativeY = (absoluteY - imageLayout.y) / imageLayout.height;
    
    if (relativeX >= 0 && relativeX <= 1 && relativeY >= 0 && relativeY <= 1) {
      try {
        const storageManager = StorageManager.getInstance();
        const locationId = storageManager.generateId();
        
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
      } catch (error) {
        console.error('Error adding location:', error);
        Alert.alert('错误', '添加位置失败');
      }
    }
  };

  const handleMarkerPress = (marker: LocationMarker) => {
    navigation.navigate('LocationDetail', {
      spaceId: space.id,
      locationId: marker.id,
      spaceTitle: space.title,
    });
  };

  const renderMarker = (marker: LocationMarker) => {
    const markerX = marker.x * imageLayout.width;
    const markerY = marker.y * imageLayout.height;

    return (
      <TouchableOpacity
        key={marker.id}
        style={[
          styles.marker,
          {
            left: markerX + imageLayout.x - 15,
            top: markerY + imageLayout.y - 15,
          },
        ]}
        onPress={() => handleMarkerPress(marker)}
      >
        <View style={styles.markerInner}>
          <Text style={styles.markerText}>{marker.itemCount}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{space.title}</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.imageContainer}>
          <TouchableOpacity
            style={styles.fullImageContainer}
            onPress={handleTap}
            activeOpacity={1}
          >
            <Image
              source={{ uri: space.photoPath }}
              style={styles.fullImage}
              resizeMode="contain"
              onLayout={handleImageLayout}
            />
          </TouchableOpacity>
          
          {imageLayout.width > 0 && markers.map(renderMarker)}
        </View>

        <View style={styles.instructions}>
          <Text style={styles.instructionText}>
            点击图片上的任意位置来标记储物位置
          </Text>
        </View>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  backButton: {
    padding: 5,
  },
  backButtonText: {
    color: 'white',
    fontSize: 24,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    textAlign: 'center',
    flex: 1,
  },
  placeholder: {
    width: 34,
  },
  imageContainer: {
    flex: 1,
    position: 'relative',
  },
  fullImageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullImage: {
    width: '100%',
    height: '100%',
  },
  marker: {
    position: 'absolute',
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  markerInner: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FF6B6B',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  markerText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  instructions: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  instructionText: {
    color: 'white',
    fontSize: 14,
    textAlign: 'center',
  },
});