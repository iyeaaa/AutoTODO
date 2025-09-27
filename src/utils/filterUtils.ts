import type { Todo } from '../types';

export const getFilteredTodosWithHierarchy = (
  todos: Todo[],
  filter: 'all' | 'completed' | 'active',
  categoryFilter: string,
  subcategoryFilter: string
) => {
  const matchesFilter = (todo: Todo) => {
    let statusMatch = true;
    if (filter === 'completed') statusMatch = todo.completed;
    if (filter === 'active') statusMatch = !todo.completed;

    let categoryMatch = true;
    if (categoryFilter !== 'all') categoryMatch = todo.category === categoryFilter;

    let subcategoryMatch = true;
    if (subcategoryFilter !== 'all') {
      if (subcategoryFilter === 'none') {
        subcategoryMatch = !todo.subcategory_id;
      } else {
        subcategoryMatch = todo.subcategory_id === subcategoryFilter;
      }
    }

    return statusMatch && categoryMatch && subcategoryMatch;
  };

  const getAncestors = (todoId: string): Todo[] => {
    const ancestors: Todo[] = [];
    let currentTodo = todos.find(t => t.id === todoId);

    while (currentTodo && currentTodo.parent_id) {
      const parent = todos.find(t => t.id === currentTodo!.parent_id);
      if (parent) {
        ancestors.unshift(parent);
        currentTodo = parent;
      } else {
        break;
      }
    }
    return ancestors;
  };

  const getDescendants = (todoId: string): Todo[] => {
    const descendants: Todo[] = [];
    const stack = [todoId];

    while (stack.length > 0) {
      const currentId = stack.pop()!;
      const children = todos.filter(t => t.parent_id === currentId);
      descendants.push(...children);
      stack.push(...children.map(child => child.id));
    }
    return descendants;
  };

  const relevantTodoIds = new Set<string>();

  todos.forEach(todo => {
    if (matchesFilter(todo)) {
      relevantTodoIds.add(todo.id);

      getAncestors(todo.id).forEach(ancestor => {
        relevantTodoIds.add(ancestor.id);
      });

      getDescendants(todo.id).forEach(descendant => {
        relevantTodoIds.add(descendant.id);
      });
    }
  });

  return todos.filter(todo => relevantTodoIds.has(todo.id));
};

export const getCategoryInfo = (
  categoryName: string,
  categories: any[],
  isDark: boolean
) => {
  const category = categories.find(cat => cat.name === categoryName);
  if (!category) {
    return {
      color: '#6B7280',
      icon: '',
      className: isDark ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' : 'bg-gray-100 text-gray-800'
    };
  }

  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  };

  const rgb = hexToRgb(category.color);
  const bgOpacity = isDark ? '0.2' : '0.1';
  const textOpacity = isDark ? '0.9' : '0.8';

  return {
    color: category.color,
    icon: category.icon,
    className: '',
    style: {
      backgroundColor: rgb ? `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${bgOpacity})` : undefined,
      color: rgb ? `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${textOpacity})` : undefined,
    }
  };
};