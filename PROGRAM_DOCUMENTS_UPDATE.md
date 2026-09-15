# Program Documents Update - Simple Required/Optional Design

## Summary
Implemented a simple checkbox-style design where all documents are shown as "Optional" by default. Users can click to mark documents as "Required" (purple background with checkmark). Only selected documents will be saved to the database.

## Design Logic

### Default State:
- **All documents visible** with white background
- **All show "Optional" tag** in gray text
- **Clean white cards** with gray border

### When Clicked (Required):
- **Purple background** with solid border
- **Checkmark icon** appears (✓)
- **"Required" tag** in purple text
- **Auto-saved** to database

### When Clicked Again:
- **Returns to Optional** state (white background)
- **Checkmark removed**
- **Removed from database**

## Visual States

### 1. Optional (Default - Not Selected)
```
┌─────────────────────┐
│ Document Name       │
│ Optional (gray)     │
└─────────────────────┘
White bg, gray border
```

### 2. Required (Selected)
```
┌─────────────────────┐
│ Document Name    ✓  │
│ Required (purple)   │
└─────────────────────┘
Purple bg, solid border, checkmark
```

## Changes Made

### 1. Schema Updates (`types/schemas/university-program.ts`)
- Added `document_requirements` field with `requirement_type` enum
- Supports "REQUIRED" and "OPTIONAL" states

### 2. Form Logic (`withUniversityProgramFormLogic.tsx`)
- Click adds document as "REQUIRED" 
- Click again removes document
- Only selected documents saved to database

### 3. Form UI (`program-form-view.tsx`)
- All documents displayed by default
- White background = Optional (not selected)
- Purple background + checkmark = Required (selected)
- Tag shows current state below document name
- Simple click to toggle

### 4. Server-Side (`lib/program/university-server.ts`)
- Saves only selected (Required) documents
- Stores requirement_type in database
- Properly handles updates and deletes

## How It Works

### Creating a Program
1. All documents shown with "Optional" tag
2. Click any document → Becomes "Required" (purple + ✓)
3. Click again → Returns to "Optional" (removed from selection)
4. Only documents marked as "Required" are saved

### Editing a Program
1. Previously saved "Required" documents show purple + ✓
2. All others show as "Optional"
3. Click to add/remove from Required list
4. Save to update database

## UI Features
- ✅ All documents visible by default
- ✅ Clear "Optional" vs "Required" labels
- ✅ Checkmark icon on required documents
- ✅ Purple highlight for selected state
- ✅ Simple single-click interaction
- ✅ Responsive grid layout
- ✅ Smooth hover effects
- ✅ Help text: "Click on a document to mark it as Required. Click again to unmark."

## Database Behavior
- Only documents with `requirement_type: "REQUIRED"` are saved
- "Optional" documents are NOT saved (shown only in UI)
- When unmarked, documents are removed from database
- Clean data structure with no unused entries

## Testing Checklist
1. ✅ All documents visible on page load
2. ✅ All show "Optional" tag by default
3. ✅ Click changes to purple bg + checkmark + "Required" tag
4. ✅ Click again removes purple bg and returns to Optional
5. ✅ Save stores only Required documents
6. ✅ Edit page loads with correct Required documents marked
7. ✅ Responsive design works on mobile/tablet/desktop
