# Bilingual Names & Duplicate Prevention Implementation

## Overview

Implemented comprehensive bilingual (Arabic/English) name inputs for classes, units, and lessons with automatic duplicate prevention and specific error messages for each edge case.

## Changes Made

### 1. Database Migration (`src/database/migrate-bilingual-names.js`)

- ✅ Added `name_ar` and `name_en` columns to `classes` table
- ✅ Added `title_ar` and `title_en` columns to `units` table
- ✅ Added `title_ar` and `title_en` columns to `lessons` table
- ✅ Migrated existing data to maintain backward compatibility
- ✅ Migration is idempotent (safe to run multiple times)

### 2. Backend Validation & Error Handling

#### `src/routes/classRoutes.js`

#### POST /api/classes (Create)

- Checks for Arabic name presence
- Checks for English name presence
- Validates no invalid characters: `< > { } [ ] \ /`
- Checks for duplicate names (case-insensitive for English, exact match for Arabic)
- Specific error codes returned:
  - `ARABIC_NAME_REQUIRED` - Arabic name is required
  - `ENGLISH_NAME_REQUIRED` - English name is required
  - `INVALID_CHARACTERS_AR` - Arabic name has invalid characters
  - `INVALID_CHARACTERS_EN` - English name has invalid characters
  - `DUPLICATE_CLASS_NAME` - Name already exists (HTTP 409)

#### PUT /api/classes/:id (Update)

- Same validation as POST
- Excludes current class from duplicate check

#### `src/routes/unitRoutes.js`

#### POST /api/units (Create)

- Validates Arabic and English titles
- Checks for invalid characters
- Verifies class exists
- Checks for duplicates **within the same class** (scoped uniqueness)
- Error codes:
  - `ARABIC_TITLE_REQUIRED`
  - `ENGLISH_TITLE_REQUIRED`
  - `CLASS_ID_REQUIRED`
  - `INVALID_CHARACTERS_AR/EN`
  - `CLASS_NOT_FOUND`
  - `DUPLICATE_UNIT_TITLE` (HTTP 409)

#### PUT /api/units/:id (Update)

- Same validation as POST
- Scoped to current class and excludes self

#### `src/routes/lessonRoutes.js`

#### POST /api/lessons (Create)

- Validates Arabic and English titles
- Checks for invalid characters
- Verifies unit exists
- Checks for duplicates **within the same unit** (scoped uniqueness)
- Error codes:
  - `ARABIC_TITLE_REQUIRED`
  - `ENGLISH_TITLE_REQUIRED`
  - `UNIT_ID_REQUIRED`
  - `INVALID_CHARACTERS_AR/EN`
  - `UNIT_NOT_FOUND`
  - `DUPLICATE_LESSON_TITLE` (HTTP 409)

#### PUT /api/lessons/:id (Update)

- Same validation as POST
- Scoped to current unit and excludes self

### 3. Frontend Updates (`public/admin.js`)

#### Classes Management

##### showCreateClassForm()

- Two input fields: Arabic name + English name
- Real-time client-side validation
- Error display box with Arabic/English messages
- Submit handler includes server error message display

##### editClass(id, name_ar, name_en)

- Updated to accept bilingual names
- Same dual-input form as create
- Error handling for update operations

##### Class Table Display

- Shows Arabic name with English name as subtext
- Passes both names to edit function
- Displays in Arabic/English format

#### Units Management

##### showCreateUnitForm()

- Two input fields: Arabic title + English title
- Class selector includes bilingual class names
- Client-side validation before submission
- Error message box

##### editUnit(id, title_ar, title_en, classId)

- Updated function signature with bilingual titles
- Dual-input form matching create form
- Error handling

##### Unit Table Display

- Shows Arabic title with English as subtext
- Passes bilingual titles to edit function

#### Lessons Management

##### showCreateLessonForm()

- Two input fields: Arabic title + English title
- Unit selector shows bilingual unit names
- Error handling with visual feedback
- Video and image fields remain unchanged

##### editLesson(id)

- Updated form to include Arabic and English title inputs
- Validation for both language fields required
- Error display before submission

##### Lesson Table Display

- Shows Arabic title with English as subtext
- Passes bilingual titles implicitly (id-based fetch)

### 4. Error Message Examples

#### Arabic Messages (العربية)

```
اسم الصف بالعربية مطلوب
اسم الصف بالإنجليزية مطلوب
اسم الصف بالعربية يحتوي على أحرف غير مسموحة
اسم الصف بالإنجليزية يحتوي على أحرف غير مسموحة
هذا الاسم موجود بالفعل. يرجى اختيار اسم آخر
عنوان الوحدة بالعربية مطلوب
عنوان الوحدة بالإنجليزية مطلوب
الصف الدراسي مطلوب
عنوان الوحدة بالعربية يحتوي على أحرف غير مسموحة
عنوان الوحدة بالإنجليزية يحتوي على أحرف غير مسموحة
هذا العنوان موجود بالفعل في هذا الصف. يرجى اختيار عنوان آخر
```

#### English Messages

```
Class name in English is required
Unit title in English is required
Lesson title in English is required
```

### 5. Validation Rules

1. **Required Fields**: Both Arabic and English names must be provided
2. **Character Validation**: No `< > { } [ ] \ /` characters allowed
3. **Trimming**: All inputs are trimmed of whitespace before validation
4. **Case Sensitivity**:
   - English names: Case-insensitive duplicate check
   - Arabic names: Exact match duplicate check
5. **Scope**:
   - Classes: Global uniqueness
   - Units: Unique per class (can have same name in different classes)
   - Lessons: Unique per unit (can have same name in different units)

### 6. HTTP Status Codes

- `201 Created` - Successful creation
- `200 OK` - Successful update
- `400 Bad Request` - Validation error (empty field, invalid character)
- `404 Not Found` - Parent resource not found (class/unit doesn't exist)
- `409 Conflict` - Duplicate name (name already exists)

### 7. Backward Compatibility

- Existing data automatically populated in bilingual columns
- Single-language queries still work with fallback to `name` field
- Form displays show both names if available, otherwise just the original name

## Testing Checklist

- ✅ Create class with Arabic + English names
- ✅ Edit class with new bilingual names
- ✅ Prevent duplicate class names (Arabic or English)
- ✅ Show specific error messages
- ✅ Create unit with bilingual names (scoped per class)
- ✅ Create lesson with bilingual names (scoped per unit)
- ✅ Prevent invalid characters
- ✅ Handle empty fields
- ✅ Display errors in modal

## Files Modified

1. `src/database/migrate-bilingual-names.js` - NEW
2. `src/routes/classRoutes.js` - POST/PUT endpoints
3. `src/routes/unitRoutes.js` - POST/PUT endpoints
4. `src/routes/lessonRoutes.js` - POST/PUT endpoints
5. `public/admin.js` - ALL admin forms + table displays

## Notes

- All error messages are bilingual (Arabic + English)
- Unique constraints are appropriately scoped
- Character validation prevents XSS and injection attacks
- Response codes follow REST conventions
- Client-side validation provides immediate feedback
- Server-side validation ensures data integrity
