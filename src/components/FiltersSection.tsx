import type { Todo, Category, SubCategory } from '../types';

interface FiltersSectionProps {
  filter: 'all' | 'completed' | 'active';
  setFilter: (filter: 'all' | 'completed' | 'active') => void;
  categoryFilter: string;
  setCategoryFilter: (category: string) => void;
  subcategoryFilter: string;
  setSubcategoryFilter: (subcategory: string) => void;
  categories: Category[];
  subcategories: SubCategory[];
  todos: Todo[];
  isDark: boolean;
  getCategoryInfo: (categoryName: string) => {
    color: string;
    icon: string;
    className: string;
    style?: React.CSSProperties;
  };
}

export default function FiltersSection({
  filter,
  setFilter,
  categoryFilter,
  setCategoryFilter,
  subcategoryFilter,
  setSubcategoryFilter,
  categories,
  subcategories,
  todos,
  isDark,
  getCategoryInfo,
}: FiltersSectionProps) {
  return (
    <div className="space-y-4 mb-6 animate-slide-in-up" style={{ animationDelay: '0.2s' }}>
      {/* Status Filters */}
      <div className="flex flex-wrap gap-2">
        {[
          { key: 'all' as const, label: '전체' },
          { key: 'active' as const, label: '미완료' },
          { key: 'completed' as const, label: '완료' }
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-4 py-3 min-h-[44px] rounded-xl text-sm transition-all duration-300 transform hover:scale-105 touch-manipulation ${
              filter === key
                ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                : isDark
                  ? 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200 shadow-sm hover:shadow-md'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Category Filters */}
      {categories.length > 0 && (
        <div className="space-y-3">
          {/* Main category filters */}
          <div className="flex flex-wrap gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
            <button
              onClick={() => {
                setCategoryFilter('all');
                setSubcategoryFilter('all');
              }}
              className={`px-3 py-2 min-h-[44px] rounded-lg text-sm transition-all duration-300 transform hover:scale-105 touch-manipulation ${
                categoryFilter === 'all'
                  ? 'bg-gray-500 text-white shadow-md'
                  : isDark
                    ? 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200'
              }`}
            >
              모든 카테고리
            </button>
            {categories.map(category => {
              const categoryTodos = todos.filter(todo => todo.category === category.name);
              const completedCategoryTodos = categoryTodos.filter(todo => todo.completed);
              const categoryInfo = getCategoryInfo(category.name);

              return (
                <button
                  key={category.id}
                  onClick={() => {
                    setCategoryFilter(category.name);
                    setSubcategoryFilter('all');
                  }}
                  className={`px-3 py-2 min-h-[44px] rounded-lg text-sm transition-all duration-300 transform hover:scale-105 touch-manipulation flex items-center gap-1 whitespace-nowrap ${
                    categoryFilter === category.name
                      ? 'shadow-md ring-2 ring-offset-1'
                      : 'hover:shadow-sm'
                  }`}
                  style={{
                    backgroundColor: categoryFilter === category.name
                      ? categoryInfo.color
                      : categoryInfo.style?.backgroundColor,
                    color: categoryFilter === category.name
                      ? 'white'
                      : categoryInfo.style?.color,
                    ...(categoryFilter === category.name ? { '--tw-ring-color': categoryInfo.color } : {})
                  } as React.CSSProperties}
                >
                  {category.icon && <span>{category.icon}</span>}
                  <span>{category.name}</span>
                  <span className={`ml-1 px-1 py-0.5 rounded-full text-xs ${
                    categoryFilter === category.name
                      ? 'bg-white/20 text-white'
                      : isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600'
                  }`}>
                    {completedCategoryTodos.length}/{categoryTodos.length}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Subcategory filters - only show when a specific category is selected */}
          {categoryFilter !== 'all' && subcategories.filter(sub => {
            const category = categories.find(cat => cat.name === categoryFilter);
            return category && sub.parent_category_id === category.id;
          }).length > 0 && (
            <div className="flex flex-wrap gap-2 pl-4 border-l-2 border-gray-300 dark:border-gray-600">
              <button
                onClick={() => setSubcategoryFilter('all')}
                className={`px-2 py-1 rounded text-xs transition-all duration-300 transform hover:scale-105 ${
                  subcategoryFilter === 'all'
                    ? 'bg-gray-400 text-white shadow-sm'
                    : isDark
                      ? 'bg-gray-700 text-gray-400 hover:bg-gray-600 border border-gray-600'
                      : 'bg-gray-50 text-gray-500 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                전체 서브카테고리
              </button>
              <button
                onClick={() => setSubcategoryFilter('none')}
                className={`px-2 py-1 rounded text-xs transition-all duration-300 transform hover:scale-105 ${
                  subcategoryFilter === 'none'
                    ? 'bg-gray-400 text-white shadow-sm'
                    : isDark
                      ? 'bg-gray-700 text-gray-400 hover:bg-gray-600 border border-gray-600'
                      : 'bg-gray-50 text-gray-500 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                서브카테고리 없음 ({todos.filter(todo => todo.category === categoryFilter && !todo.subcategory_id).length})
              </button>
              {subcategories
                .filter(sub => {
                  const category = categories.find(cat => cat.name === categoryFilter);
                  return category && sub.parent_category_id === category.id;
                })
                .map(subcategory => {
                  const subcategoryTodos = todos.filter(todo => todo.subcategory_id === subcategory.id);
                  const completedSubcategoryTodos = subcategoryTodos.filter(todo => todo.completed);
                  const incompleteSubcategoryTodos = subcategoryTodos.filter(todo => !todo.completed);

                  return (
                    <button
                      key={subcategory.id}
                      onClick={() => setSubcategoryFilter(subcategory.id)}
                      className={`px-2 py-1 rounded text-xs transition-all duration-300 transform hover:scale-105 flex items-center gap-1 ${
                        subcategoryFilter === subcategory.id
                          ? 'shadow-md ring-1 ring-offset-1'
                          : 'hover:shadow-sm'
                      }`}
                      style={{
                        backgroundColor: subcategoryFilter === subcategory.id
                          ? subcategory.color
                          : `${subcategory.color}20`,
                        color: subcategoryFilter === subcategory.id
                          ? 'white'
                          : subcategory.color,
                        ...(subcategoryFilter === subcategory.id ? { '--tw-ring-color': subcategory.color } : {})
                      } as React.CSSProperties}
                    >
                      {subcategory.icon && <span>{subcategory.icon}</span>}
                      <span>{subcategory.name}</span>
                      <span className={`ml-1 px-1 py-0.5 rounded-full text-xs ${
                        subcategoryFilter === subcategory.id
                          ? 'bg-white/20 text-white'
                          : isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600'
                      }`}>
                        {incompleteSubcategoryTodos.length}/{completedSubcategoryTodos.length}
                      </span>
                    </button>
                  );
                })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}