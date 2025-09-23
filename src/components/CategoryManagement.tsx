import { useState, useEffect } from 'react';
import { X, Plus, Edit3, Trash2, Settings, ChevronDown, ChevronRight } from 'lucide-react';
import type { Category, SubCategory } from '../types';
import EmojiPicker from './EmojiPicker';

interface CategoryManagementProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  subcategories: SubCategory[];
  isDark: boolean;
  onAddCategory: (category: Omit<Category, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  onUpdateCategory: (id: string, updates: Partial<Category>) => Promise<void>;
  onDeleteCategory: (id: string) => Promise<void>;
  onAddSubCategory: (subcategory: Omit<SubCategory, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  onUpdateSubCategory: (id: string, updates: Partial<SubCategory>) => Promise<void>;
  onDeleteSubCategory: (id: string) => Promise<void>;
}

const PRESET_COLORS = [
  '#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444',
  '#F97316', '#06B6D4', '#8B5F87', '#6B7280', '#84CC16'
];


export default function CategoryManagement({
  isOpen,
  onClose,
  categories,
  subcategories,
  isDark,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
  onAddSubCategory,
  onUpdateSubCategory,
  onDeleteSubCategory
}: CategoryManagementProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newCategory, setNewCategory] = useState({
    name: '', color: PRESET_COLORS[0], icon: '', display_order: 0
  });
  const [editForm, setEditForm] = useState({
    name: '', color: '', icon: '', display_order: 0
  });
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [emojiPickerTarget, setEmojiPickerTarget] = useState<'new' | 'edit' | 'new-sub' | 'edit-sub'>('new');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [addingSubForCategory, setAddingSubForCategory] = useState<string | null>(null);
  const [newSubCategory, setNewSubCategory] = useState({
    name: '', color: PRESET_COLORS[0], icon: '',
    parent_category_id: '', display_order: 0
  });
  const [editingSubId, setEditingSubId] = useState<string | null>(null);
  const [editSubForm, setEditSubForm] = useState({
    name: '', color: '', icon: '', parent_category_id: '', display_order: 0
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (categories.length > 0) {
      setNewCategory(prev => ({
        ...prev,
        display_order: Math.max(...categories.map(c => c.display_order)) + 1
      }));
    }
  }, [categories]);

  const handleAddCategory = async () => {
    if (!newCategory.name.trim()) return;
    setIsSubmitting(true);
    try {
      await onAddCategory(newCategory);
      setNewCategory({ name: '', color: PRESET_COLORS[0], icon: '', display_order: 0 });
    } finally {
      setIsSubmitting(false);
    }
  };

  const startAddingSubCategory = (categoryId: string) => {
    const categorySubcategories = subcategories.filter(sub => sub.parent_category_id === categoryId);
    setNewSubCategory({
      name: '', color: PRESET_COLORS[0], icon: '',
      parent_category_id: categoryId, display_order: categorySubcategories.length
    });
    setAddingSubForCategory(categoryId);
    setExpandedCategories(prev => new Set([...prev, categoryId]));
  };

  const handleAddSubCategory = async () => {
    if (!newSubCategory.name.trim()) return;
    setIsSubmitting(true);
    try {
      await onAddSubCategory(newSubCategory);
      setNewSubCategory({ name: '', color: PRESET_COLORS[0], icon: '', parent_category_id: '', display_order: 0 });
      setAddingSubForCategory(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleExpansion = (categoryId: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const handleEmojiSelect = (emoji: string) => {
    if (emojiPickerTarget === 'new') {
      setNewCategory(prev => ({ ...prev, icon: emoji }));
    } else if (emojiPickerTarget === 'edit') {
      setEditForm(prev => ({ ...prev, icon: emoji }));
    } else if (emojiPickerTarget === 'new-sub') {
      setNewSubCategory(prev => ({ ...prev, icon: emoji }));
    } else if (emojiPickerTarget === 'edit-sub') {
      setEditSubForm(prev => ({ ...prev, icon: emoji }));
    }
    setShowEmojiPicker(false);
  };

  const handleEditStart = (category: Category) => {
    setEditingId(category.id);
    setEditForm({
      name: category.name,
      color: category.color,
      icon: category.icon,
      display_order: category.display_order
    });
  };

  const handleEditSave = async () => {
    if (!editingId || !editForm.name.trim()) return;
    setIsSubmitting(true);
    try {
      await onUpdateCategory(editingId, editForm);
      setEditingId(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditForm({ name: '', color: '', icon: '', display_order: 0 });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in">
      <div className={`max-w-3xl w-full mx-4 max-h-[90vh] overflow-hidden rounded-2xl ${
        isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
      } animate-scale-in`}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Settings className="w-6 h-6 text-blue-500" />
            <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              카테고리 관리
            </h2>
          </div>
          <button onClick={onClose} className={`p-2 rounded-lg transition-colors ${
            isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
          }`}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Add New Category */}
          <div className={`p-6 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
            <h3 className={`text-lg font-medium mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              새 카테고리 추가
            </h3>
            <div className="flex gap-3 mb-4">
              <input
                type="text"
                value={newCategory.name}
                onChange={(e) => setNewCategory(prev => ({ ...prev, name: e.target.value }))}
                placeholder="카테고리 이름"
                className={`flex-1 px-3 py-2 rounded-lg border ${
                  isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                }`}
                onKeyPress={(e) => e.key === 'Enter' && handleAddCategory()}
              />
              <button
                onClick={handleAddCategory}
                disabled={!newCategory.name.trim() || isSubmitting}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
              >
                추가
              </button>
            </div>

            <div className="flex gap-4">
              <div className="flex gap-2">
                {PRESET_COLORS.slice(0, 6).map(color => (
                  <button
                    key={color}
                    onClick={() => setNewCategory(prev => ({ ...prev, color }))}
                    className={`w-8 h-8 rounded-full border-2 ${
                      newCategory.color === color ? 'border-gray-800 dark:border-white' : 'border-gray-300'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-10 h-10 rounded border flex items-center justify-center text-lg ${
                  isDark ? 'border-gray-600 bg-gray-700' : 'border-gray-300 bg-gray-100'
                }`}>
                  {newCategory.icon || (
                    <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      없음
                    </div>
                  )}
                </div>
                <button
                  onClick={() => {
                    setEmojiPickerTarget('new');
                    setShowEmojiPicker(true);
                  }}
                  className="px-3 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 text-sm"
                >
                  {newCategory.icon ? '변경' : '선택'}
                </button>
                {newCategory.icon && (
                  <button
                    onClick={() => setNewCategory(prev => ({ ...prev, icon: '' }))}
                    className="px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 text-sm"
                  >
                    제거
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Categories List */}
          <div className="p-6">
            <h3 className={`text-lg font-medium mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              기존 카테고리
            </h3>

            <div className="space-y-2">
              {categories.map(category => {
                const categorySubcategories = subcategories.filter(sub => sub.parent_category_id === category.id);
                const isExpanded = expandedCategories.has(category.id);

                return (
                  <div key={category.id} className={`rounded-lg border ${
                    isDark ? 'border-gray-700' : 'border-gray-200'
                  }`}>
                    {/* Main Category */}
                    <div className={`p-4 ${isDark ? 'bg-gray-750' : 'bg-gray-50'}`}>
                      {editingId === category.id ? (
                        /* Edit Mode */
                        <div className="space-y-3">
                          <div className="flex gap-3">
                            <input
                              type="text"
                              value={editForm.name}
                              onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                              className={`flex-1 px-3 py-2 rounded-lg border ${
                                isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                              }`}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleEditSave();
                                if (e.key === 'Escape') handleEditCancel();
                              }}
                              autoFocus
                            />
                            <button
                              onClick={handleEditSave}
                              disabled={!editForm.name.trim() || isSubmitting}
                              className="px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
                            >
                              저장
                            </button>
                            <button
                              onClick={handleEditCancel}
                              className="px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                            >
                              취소
                            </button>
                          </div>

                          {/* Edit Color */}
                          <div className="flex gap-2">
                            {PRESET_COLORS.map(color => (
                              <button
                                key={color}
                                onClick={() => setEditForm(prev => ({ ...prev, color }))}
                                className={`w-6 h-6 rounded-full border ${
                                  editForm.color === color ? 'border-black dark:border-white' : 'border-gray-300'
                                }`}
                                style={{ backgroundColor: color }}
                              />
                            ))}
                          </div>

                          {/* Edit Icon */}
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg border flex items-center justify-center text-lg ${
                              isDark ? 'border-gray-600 bg-gray-700' : 'border-gray-300 bg-gray-100'
                            }`}>
                              {editForm.icon || (
                                <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                  없음
                                </div>
                              )}
                            </div>
                            <button
                              onClick={() => {
                                setEmojiPickerTarget('edit');
                                setShowEmojiPicker(true);
                              }}
                              className="px-3 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 text-sm"
                            >
                              {editForm.icon ? '변경' : '선택'}
                            </button>
                            {editForm.icon && (
                              <button
                                onClick={() => setEditForm(prev => ({ ...prev, icon: '' }))}
                                className="px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 text-sm"
                              >
                                제거
                              </button>
                            )}
                          </div>
                        </div>
                      ) : (
                        /* View Mode */
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {categorySubcategories.length > 0 && (
                              <button
                                onClick={() => toggleExpansion(category.id)}
                                className={`p-1 rounded transition-colors ${
                                  isDark ? 'hover:bg-gray-600' : 'hover:bg-gray-200'
                                }`}
                              >
                                {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                              </button>
                            )}
                            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: category.color }} />
                            {category.icon && <span className="text-lg">{category.icon}</span>}
                            <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                              {category.name}
                            </span>
                            {categorySubcategories.length > 0 && (
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                isDark ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-600'
                              }`}>
                                {categorySubcategories.length}개
                              </span>
                            )}
                          </div>

                          <div className="flex gap-2">
                            <button
                              onClick={() => startAddingSubCategory(category.id)}
                              className={`p-2 rounded-lg transition-colors ${
                                isDark ? 'hover:bg-green-900/20 text-green-400' : 'hover:bg-green-50 text-green-600'
                              }`}
                              title="서브카테고리 추가"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleEditStart(category)}
                              className={`p-2 rounded-lg transition-colors ${
                                isDark ? 'hover:bg-gray-600 text-gray-400' : 'hover:bg-gray-200 text-gray-600'
                              }`}
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            {categories.length > 1 && (
                              <button
                                onClick={() => onDeleteCategory(category.id)}
                                className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Subcategories */}
                    {(isExpanded || addingSubForCategory === category.id) && (
                      <div className={`border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                        {/* Existing Subcategories */}
                        {categorySubcategories.map(subcategory => (
                          <div key={subcategory.id} className={`p-3 pl-8 ${
                            isDark ? 'hover:bg-gray-700/50' : 'hover:bg-gray-100/50'
                          }`}>
                            {editingSubId === subcategory.id ? (
                              /* Subcategory Edit Mode */
                              <div className="space-y-2">
                                <div className="flex gap-2">
                                  <input
                                    type="text"
                                    value={editSubForm.name}
                                    onChange={(e) => setEditSubForm(prev => ({ ...prev, name: e.target.value }))}
                                    className={`flex-1 px-2 py-1 rounded border text-sm ${
                                      isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                                    }`}
                                    autoFocus
                                  />
                                  <button
                                    onClick={async () => {
                                      if (editSubForm.name.trim()) {
                                        setIsSubmitting(true);
                                        try {
                                          await onUpdateSubCategory(subcategory.id, editSubForm);
                                          setEditingSubId(null);
                                        } finally {
                                          setIsSubmitting(false);
                                        }
                                      }
                                    }}
                                    disabled={!editSubForm.name.trim() || isSubmitting}
                                    className="px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600"
                                  >
                                    저장
                                  </button>
                                  <button
                                    onClick={() => setEditingSubId(null)}
                                    className="px-2 py-1 bg-gray-500 text-white rounded text-xs hover:bg-gray-600"
                                  >
                                    취소
                                  </button>
                                </div>
                                <div className="flex gap-2">
                                  {PRESET_COLORS.slice(0, 6).map(color => (
                                    <button
                                      key={color}
                                      onClick={() => setEditSubForm(prev => ({ ...prev, color }))}
                                      className={`w-4 h-4 rounded-full border ${
                                        editSubForm.color === color ? 'border-black dark:border-white' : 'border-gray-300'
                                      }`}
                                      style={{ backgroundColor: color }}
                                    />
                                  ))}
                                  <div className={`w-6 h-6 rounded border flex items-center justify-center ml-2 ${
                                    isDark ? 'border-gray-600 bg-gray-600' : 'border-gray-300 bg-gray-100'
                                  }`}>
                                    {editSubForm.icon || (
                                      <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                        ×
                                      </div>
                                    )}
                                  </div>
                                  <button
                                    onClick={() => {
                                      setEmojiPickerTarget('edit-sub');
                                      setShowEmojiPicker(true);
                                    }}
                                    className="px-2 py-1 bg-purple-500 text-white rounded text-xs hover:bg-purple-600"
                                  >
                                    {editSubForm.icon ? '변경' : '선택'}
                                  </button>
                                </div>
                              </div>
                            ) : (
                              /* Subcategory View Mode */
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="w-1 h-4 bg-gray-400 rounded-full opacity-50" />
                                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: subcategory.color }} />
                                  {subcategory.icon && <span className="text-sm">{subcategory.icon}</span>}
                                  <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                                    {subcategory.name}
                                  </span>
                                </div>
                                <div className="flex gap-1">
                                  <button
                                    onClick={() => {
                                      setEditingSubId(subcategory.id);
                                      setEditSubForm({
                                        name: subcategory.name,
                                        color: subcategory.color,
                                        icon: subcategory.icon,
                                        parent_category_id: subcategory.parent_category_id,
                                        display_order: subcategory.display_order
                                      });
                                    }}
                                    className={`p-1 rounded transition-colors ${
                                      isDark ? 'hover:bg-gray-600 text-gray-500' : 'hover:bg-gray-200 text-gray-500'
                                    }`}
                                  >
                                    <Edit3 className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={() => onDeleteSubCategory(subcategory.id)}
                                    className="p-1 rounded text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}

                        {/* Add Subcategory Form */}
                        {addingSubForCategory === category.id && (
                          <div className={`p-4 pl-8 border-t ${isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
                            <div className="space-y-3">
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  value={newSubCategory.name}
                                  onChange={(e) => setNewSubCategory(prev => ({ ...prev, name: e.target.value }))}
                                  placeholder="서브카테고리 이름"
                                  className={`flex-1 px-3 py-2 rounded-lg border text-sm ${
                                    isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                                  }`}
                                  onKeyPress={(e) => e.key === 'Enter' && handleAddSubCategory()}
                                  autoFocus
                                />
                                <button
                                  onClick={handleAddSubCategory}
                                  disabled={!newSubCategory.name.trim() || isSubmitting}
                                  className="px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 text-sm"
                                >
                                  추가
                                </button>
                                <button
                                  onClick={() => setAddingSubForCategory(null)}
                                  className="px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 text-sm"
                                >
                                  취소
                                </button>
                              </div>

                              <div className="flex gap-4">
                                <div className="flex gap-1">
                                  {PRESET_COLORS.slice(0, 6).map(color => (
                                    <button
                                      key={color}
                                      onClick={() => setNewSubCategory(prev => ({ ...prev, color }))}
                                      className={`w-6 h-6 rounded-full border ${
                                        newSubCategory.color === color ? 'border-black dark:border-white' : 'border-gray-300'
                                      }`}
                                      style={{ backgroundColor: color }}
                                    />
                                  ))}
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className={`w-8 h-8 rounded border flex items-center justify-center ${
                                    isDark ? 'border-gray-600 bg-gray-600' : 'border-gray-300 bg-gray-100'
                                  }`}>
                                    {newSubCategory.icon || (
                                      <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                        없음
                                      </div>
                                    )}
                                  </div>
                                  <button
                                    onClick={() => {
                                      setEmojiPickerTarget('new');
                                      setShowEmojiPicker(true);
                                    }}
                                    className="px-2 py-1 bg-purple-500 text-white rounded text-xs hover:bg-purple-600"
                                  >
                                    {newSubCategory.icon ? '변경' : '선택'}
                                  </button>
                                  {newSubCategory.icon && (
                                    <button
                                      onClick={() => setNewSubCategory(prev => ({ ...prev, icon: '' }))}
                                      className="px-2 py-1 bg-gray-500 text-white rounded text-xs hover:bg-gray-600"
                                    >
                                      제거
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Emoji Picker */}
        <EmojiPicker
          isOpen={showEmojiPicker}
          onClose={() => setShowEmojiPicker(false)}
          onSelect={handleEmojiSelect}
          currentEmoji={
            emojiPickerTarget === 'new' ? newCategory.icon :
            emojiPickerTarget === 'edit' ? editForm.icon :
            emojiPickerTarget === 'new-sub' ? newSubCategory.icon :
            editSubForm.icon
          }
          categoryName={
            emojiPickerTarget === 'new' ? newCategory.name :
            emojiPickerTarget === 'edit' ? editForm.name :
            ''
          }
          isDark={isDark}
        />
      </div>
    </div>
  );
}