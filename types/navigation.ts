import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { StorageSpace, StorageItem } from './index';

export type RootStackParamList = {
  StorageList: undefined;
  AddStorageSpace: undefined;
  StorageDetail: {
    space: StorageSpace;
  };
  LocationDetail: {
    spaceId: string;
    locationId: string;
    spaceTitle: string;
  };
  EditItem: {
    spaceId: string;
    locationId: string;
    item: StorageItem | null;
  };
};

export type StorageDetailScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'StorageDetail'
>;

export type StorageDetailScreenRouteProp = RouteProp<
  RootStackParamList,
  'StorageDetail'
>;

export type LocationDetailScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'LocationDetail'
>;

export type LocationDetailScreenRouteProp = RouteProp<
  RootStackParamList,
  'LocationDetail'
>;

export type EditItemScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'EditItem'
>;

export type EditItemScreenRouteProp = RouteProp<
  RootStackParamList,
  'EditItem'
>;