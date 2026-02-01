# Testing Guide - Bilingual Names & Duplicate Prevention

## How to Test

### 1. Login to Admin Panel
- Navigate to: http://localhost:3000/admin/login
- Default credentials: admin / ChangeThisPassword123!
- Or use credentials from .env

### 2. Test Class Creation with Bilingual Names

**Normal Flow (Success)**:
1. Go to "الصفوف الدراسية" (Classes)
2. Click "صف جديد" (New Class)
3. Enter Arabic name: "الصف الأول" (First Grade)
4. Enter English name: "First Grade"
5. Click "حفظ الصف" (Save Class)
6. ✅ Success! Class appears in table with both names

**Edge Cases to Test**:

| Test Case | Arabic Input | English Input | Expected Result |
|-----------|-------------|---------------|-----------------|
| Empty Arabic | (blank) | "Grade One" | Error: "اسم الصف بالعربية مطلوب" |
| Empty English | "الصف الأول" | (blank) | Error: "Class name in English is required" |
| Invalid Chars AR | "الصف<script>" | "Grade" | Error: "اسم الصف بالعربية يحتوي على أحرف غير مسموحة" |
| Invalid Chars EN | "الصف" | "Grade{test}" | Error: "...يحتوي على أحرف غير مسموحة" |
| Duplicate Arabic | "الصف الأول" | "Something Else" | Error 409: "هذا الاسم موجود بالفعل" |
| Duplicate English (case-insensitive) | "Something" | "FIRST GRADE" | If "First Grade" exists → Error 409 |

### 3. Test Unit Creation (Scoped Duplicates)

**Success Case**:
1. Go to "الوحدات الدراسية" (Units)
2. Click "وحدة جديدة" (New Unit)
3. Arabic title: "الوحدة الأولى"
4. English title: "Unit One"
5. Select class: "الصف الأول (First Grade)"
6. Click save
7. ✅ Unit created

**Scoped Duplicate Test**:
1. Create another unit in same class with same names
2. ❌ Should fail with: "هذا العنوان موجود بالفعل في هذا الصف"
3. Create same name unit in DIFFERENT class
4. ✅ Should succeed (duplicates allowed across classes)

### 4. Test Lesson Creation (Scoped per Unit)

**Success Case**:
1. Go to "الدروس" (Lessons)
2. Click "درس جديد" (New Lesson)
3. Arabic title: "درس الفيزياء"
4. English title: "Physics Lesson"
5. Select unit: "الوحدة الأولى"
6. Add optional videos/images
7. Click save
8. ✅ Lesson created

**Scoped Duplicate Test**:
1. Create another lesson in same unit with same names
2. ❌ Should fail: "هذا العنوان موجود بالفعل في هذه الوحدة"
3. Create same name lesson in DIFFERENT unit
4. ✅ Should succeed

### 5. Test Edit Operations

**Edit Class**:
1. Click "تعديل" (Edit) on any class
2. Change Arabic or English name
3. ✅ Should update successfully
4. Change to existing name
5. ❌ Should show duplicate error

**Edit Unit**:
1. Click "تعديل" on any unit
2. Change names
3. Change to duplicate names
4. ❌ Should error (scoped to same class only)

**Edit Lesson**:
1. Click "تعديل" on any lesson
2. Change bilingual titles
3. ✅ Should update
4. Duplicate check within same unit

### 6. Table Display Verification

**Classes Table**:
- Shows Arabic name in large text
- Shows English name in smaller gray text below

**Units Table**:
- Same bilingual display format
- Shows which class it belongs to

**Lessons Table**:
- Shows bilingual titles
- Shows unit and class

### 7. Invalid Character Testing

Try submitting with these characters (should all fail):
```
< > { } [ ] \ /
```

Valid characters (should work):
```
Arabic: ا ب ج د ه و ز ح ط ي ك ل م ن ع غ ف ق ص ش ث خ ذ ض ة ئ ؤ آ أ ى
English: a-z A-Z 0-9 Space - , . : ؛ ء (comma, period, etc.)
```

### 8. Error Message Localization

**Messages in Arabic:**
- All validation errors
- Success messages
- Confirmation dialogs
- Table headers

**Messages in English:**
- Some field labels remain in English
- English name inputs show English prompts
- Mixed language interface (intentional for bilingual support)

### 9. HTTP Response Verification

Open browser Developer Tools (F12) → Network tab

**Success (201)**:
```json
{
  "id": 1,
  "name": "الصف الأول",
  "name_ar": "الصف الأول",
  "name_en": "First Grade",
  "created_at": "2024-01-15T10:30:00Z"
}
```

**Validation Error (400)**:
```json
{
  "error": "اسم الصف بالعربية مطلوب",
  "code": "ARABIC_NAME_REQUIRED"
}
```

**Duplicate Error (409)**:
```json
{
  "error": "هذا الاسم موجود بالفعل. يرجى اختيار اسم آخر",
  "code": "DUPLICATE_CLASS_NAME"
}
```

### 10. Data Persistence

After creating items, refresh the page:
- ✅ All items persist
- ✅ Bilingual names still show
- ✅ Duplicate prevention still works

## Success Criteria

- [ ] Classes show Arabic + English names in table
- [ ] Creating duplicate Arabic name shows error
- [ ] Creating duplicate English name (case-insensitive) shows error
- [ ] Invalid characters are rejected
- [ ] Units scoped to class (same name allowed in different classes)
- [ ] Lessons scoped to unit (same name allowed in different units)
- [ ] All error messages appear in modals
- [ ] Edit operations validate same as create
- [ ] Server returns correct HTTP status codes
- [ ] Data persists after page refresh
