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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { StorageSpace } from '../types';
import { StorageManager } from '../utils/storage';

const { width } = Dimensions.get('window');

interface Props {
  navigation: any;
}

export default function StorageListScreen({ navigation }: Props) {
  const [storageSpaces, setStorageSpaces] = useState<StorageSpace[]>([]);
  const [loading, setLoading] = useState(true);

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

  const renderStorageSpace = ({ item }: { item: StorageSpace }) => (
    <TouchableOpacity
      style={styles.spaceItem}
      onPress={() => navigation.navigate('StorageDetail', { space: item })}
    >
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: item.thumbnailPath || item.photoPath }}
          style={styles.thumbnail}
          resizeMode="cover"
        />
      </View>
      <View style={styles.titleContainer}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.locationCount}>
          {item.locations.length} 个位置
        </Text>
      </View>
    </TouchableOpacity>
  );

  const handleAddSpace = () => {
    navigation.navigate('AddStorageSpace');
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
        <TouchableOpacity style={styles.addButton} onPress={handleAddSpace}>
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
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
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  locationCount: {
    fontSize: 14,
    color: '#666',
  },
});