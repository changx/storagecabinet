# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

StorageCabinet (储物记录) is a React Native mobile application built with Expo that helps users organize and track items in physical storage spaces through visual coordinate mapping and gesture-based area selection.

## Development Commands

```bash
npm start          # Start Expo development server
npm run android    # Run on Android device/simulator  
npm run ios        # Run on iOS device/simulator
npm run web        # Run in web browser
```

## Technology Stack

- **Framework**: React Native with Expo SDK (~54.0.6)
- **Language**: TypeScript with strict mode enabled
- **Navigation**: React Navigation v7 with Stack Navigator
- **Storage**: AsyncStorage for data persistence + FileSystem for image storage
- **Gestures**: React Native Gesture Handler for area selection
- **Media**: Expo Image Picker and Media Library for photo operations

## Core Architecture & User Flow

### Navigation Flow
```
StorageListScreen (储物空间列表页)
├── Landscape thumbnail + title for each storage space
├── Click item → StorageDetailScreen (储物空间详情页)
    ├── Fullscreen photo display with dual-mode interaction
    ├── VIEW MODE (default): Click markers → LocationDetailScreen
    ├── EDIT MODE: Swipe to define new storage locations (圈定储物位置)
    ├── Toggle button: 编辑/完成 (top-right header)
    ├── Click marker → LocationDetailScreen (储物位置详情页)
        ├── Item list with photo + text per item
        ├── Delete/edit existing items
        ├── Add button (右上角) → EditItemScreen (物品编辑页面)
            ├── Top: Photo selection (camera/gallery)
            ├── Bottom: Text input area
            ├── Save button (右上角) → return to LocationDetailScreen
```

### Data Architecture

#### Storage System
- **AsyncStorage**: JSON data persistence for StorageSpace metadata
- **FileSystem**: Image file storage in `FileSystem.documentDirectory + 'storage_images/'`
- **Data Flow**: StorageManager singleton handles all data operations

#### Data Structure
```typescript
StorageSpace {
  id: string
  title: string
  photoPath: string (main space photo)
  thumbnailPath: string (landscape thumbnail)
  locations: StorageLocation[]
}

StorageLocation {
  id: string
  x: number // coordinate percentage (0-100%)
  y: number // coordinate percentage (0-100%)
  items: StorageItem[]
}

StorageItem {
  id: string
  photoPath: string
  description: string
  createdAt: string
  updatedAt: string
}
```

## Key Implementation Details

#### Mode-Based Interaction System
**Dual-Mode Design for StorageDetailScreen:**
- **VIEW MODE (default)**: 
  - Markers fully visible (opacity: 1.0)
  - Click markers to navigate to LocationDetailScreen
  - Support photo zoom and pan for detailed viewing
  - Header button shows "编辑"
  
- **EDIT MODE**:
  - Markers semi-transparent (opacity: 0.5) and non-clickable
  - Single-finger swipe gesture to define new storage areas
  - Real-time selection box with dashed border overlay
  - Header button shows "完成"
  - Bottom hint text: "滑动选择储物区域"

**Gesture Implementation:**
- Pan gesture only enabled in EDIT MODE
- Area coordinates saved as percentage-based regions (0-100%)
- Selection box appears during drag, confirms on release
- Haptic feedback on mode toggle and area creation

#### Image Management
- Directory-based organization in `storage_images/`
- Landscape thumbnail generation for list view
- Full-resolution storage for detail views
- File cleanup on deletion operations

#### Data Persistence
- **StorageManager singleton**: Centralized data operations
- **AsyncStorage**: JSON persistence for metadata
- **FileSystem**: Image file operations
- **Data integrity**: Proper error handling and cleanup

### UI Implementation Patterns

#### Photo Handling
- **List View**: Landscape-cropped thumbnails with titles
- **Detail View**: Fullscreen photo with mode-based overlays
  - VIEW MODE: Interactive markers with item counts
  - EDIT MODE: Semi-transparent markers + selection overlay
- **Item View**: Photo + text list items with edit/delete actions
- **Edit View**: Photo picker (camera/gallery) + text input

#### Location Marker Design
- **Visual Style**: Circular markers with white border + colored fill
- **Content Display**: Show item count number in center
- **Size**: 40x40 px with 20px border radius
- **Shadow**: Drop shadow for depth (iOS/Android compatible)
- **States**: Normal (clickable) vs Edit mode (disabled)

#### Chinese Language Interface
- All UI text in Chinese (储物记录, 储物空间, 储物位置, etc.)
- Right-to-left action buttons (右上角添加/保存按钮)
- Cultural UX patterns for Chinese users

## File Structure
```
StorageCabinet/
├── screens/                    # Screen components
│   ├── StorageListScreen.tsx      # 储物空间列表页
│   ├── StorageDetailScreen.tsx    # 储物空间详情页  
│   ├── LocationDetailScreen.tsx   # 储物位置详情页
│   └── EditItemScreen.tsx         # 物品编辑页面
├── navigation/                 # AppNavigator.tsx
├── types/index.ts             # TypeScript definitions
├── utils/storage.ts           # StorageManager singleton
└── App.tsx                    # Root component
```

## Critical Implementation Notes

- **Singleton Pattern**: StorageManager.getInstance() for all data operations
- **Mode State Management**: Boolean `isEditMode` state controls dual-mode behavior
- **Gesture Conflict Resolution**: Pan gesture only enabled in EDIT MODE
- **Visual Feedback**: Real-time selection box with dashed border during area selection
- **Haptic Integration**: Touch feedback on mode toggle and area creation
- **Image Processing**: Thumbnail generation and landscape cropping
- **Navigation State**: Proper data refresh when returning from edit screens
- **Permission Handling**: Camera and external storage access for Android/iOS

## Component Architecture

### StorageDetailScreen Key Components
```typescript
interface StorageDetailState {
  isEditMode: boolean;
  selectedArea: SelectionArea | null;
  isSelecting: boolean;
}

interface SelectionArea {
  startX: number;
  startY: number;
  width: number;
  height: number;
}
```

### Required Dependencies
- `react-native-gesture-handler`: Pan gesture for area selection
- `react-native-reanimated`: Smooth animations and transitions
- `expo-haptics`: Touch feedback on interactions