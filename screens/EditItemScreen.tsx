import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { StorageItem } from '../types';
import { EditItemScreenNavigationProp, EditItemScreenRouteProp } from '../types/navigation';
import { StorageManager } from '../utils/storage';

interface Props {
  navigation: EditItemScreenNavigationProp;
  route: EditItemScreenRouteProp;
}

export default function EditItemScreen({ navigation, route }: Props) {
  const { spaceId, locationId, item } = route.params;
  const isEditing = !!item;
  
  const [imageUri, setImageUri] = useState<string | null>(item?.photoPath || null);
  const [description, setDescription] = useState(item?.description || '');
  const [saving, setSaving] = useState(false);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('权限不足', '需要访问相册权限才能选择照片');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: false,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    try {
      console.log('开始请求相机权限...');
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      console.log('相机权限状态:', status);
      
      if (status !== 'granted') {
        Alert.alert('权限不足', '需要相机权限才能拍照');
        return;
      }

      console.log('启动相机...');
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: 'images',
        allowsEditing: false,
        quality: 0.8,
      });

      console.log('相机结果:', result);

      if (!result.canceled && result.assets[0]) {
        console.log('设置图片URI:', result.assets[0].uri);
        setImageUri(result.assets[0].uri);
      } else {
        console.log('用户取消了拍照或没有获取到图片');
      }
    } catch (error) {
      console.error('拍照过程中出现错误:', error);
      Alert.alert('错误', '拍照失败，请重试');
    }
  };

  const showImagePicker = () => {
    Alert.alert(
      '选择照片',
      '请选择照片来源',
      [
        { text: '相册', onPress: pickImage },
        { text: '拍照', onPress: takePhoto },
        { text: '取消', style: 'cancel' },
      ],
      { cancelable: true }
    );
  };

  const handleSave = async () => {
    if (!imageUri) {
      Alert.alert('错误', '请选择或拍摄一张照片');
      return;
    }

    if (!description.trim()) {
      Alert.alert('错误', '请输入物品描述');
      return;
    }

    try {
      setSaving(true);
      const storageManager = StorageManager.getInstance();
      
      let photoPath = imageUri;
      
      // 如果是新照片（不是已保存的路径），则保存到本地
      if (!imageUri.startsWith(FileSystem.documentDirectory || '')) {
        const itemId = item?.id || storageManager.generateId();
        photoPath = await storageManager.saveImageToLocal(
          imageUri,
          `item_${itemId}.jpg`
        );
      }

      const now = new Date().toISOString();
      const itemData: StorageItem = {
        id: item?.id || storageManager.generateId(),
        photoPath,
        description: description.trim(),
        createdAt: item?.createdAt || now,
        updatedAt: now,
      };

      if (isEditing && item) {
        await storageManager.updateItem(spaceId, locationId, item.id, itemData);
      } else {
        await storageManager.addItemToLocation(spaceId, locationId, itemData);
      }
      
      Alert.alert('成功', isEditing ? '物品更新成功' : '物品添加成功', [
        {
          text: '确定',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      console.error('Error saving item:', error);
      Alert.alert('错误', '保存失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.cancelButtonText}>取消</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {isEditing ? '编辑物品' : '添加物品'}
          </Text>
          <TouchableOpacity 
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            <Text style={styles.saveButtonText}>
              {saving ? '保存中...' : '保存'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.imageSection}>
            <Text style={styles.sectionTitle}>照片</Text>
            <TouchableOpacity style={styles.imageContainer} onPress={showImagePicker}>
              {imageUri ? (
                <Image source={{ uri: imageUri }} style={styles.selectedImage} resizeMode="cover" />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Text style={styles.imagePlaceholderIcon}>📷</Text>
                  <Text style={styles.imagePlaceholderText}>点击添加照片</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.descriptionSection}>
            <Text style={styles.sectionTitle}>描述</Text>
            <TextInput
              style={styles.descriptionInput}
              value={description}
              onChangeText={setDescription}
              placeholder="输入物品描述信息..."
              multiline
              textAlignVertical="top"
              maxLength={500}
            />
            <Text style={styles.characterCount}>
              {description.length}/500
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  cancelButton: {
    padding: 5,
  },
  cancelButtonText: {
    color: '#007AFF',
    fontSize: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  saveButton: {
    padding: 5,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  imageSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  imageContainer: {
    width: '100%',
    height: 200,
  },
  selectedImage: {
    width: '100%',
    height: '100%',
    borderRadius: 15,
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f0f0f0',
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
  },
  imagePlaceholderIcon: {
    fontSize: 48,
    marginBottom: 10,
  },
  imagePlaceholderText: {
    fontSize: 16,
    color: '#666',
  },
  descriptionSection: {
    marginBottom: 20,
  },
  descriptionInput: {
    backgroundColor: 'white',
    borderRadius: 15,
    paddingHorizontal: 15,
    paddingVertical: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    height: 120,
  },
  characterCount: {
    textAlign: 'right',
    color: '#666',
    fontSize: 12,
    marginTop: 5,
  },
});