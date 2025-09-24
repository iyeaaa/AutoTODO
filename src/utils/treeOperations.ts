import type { Todo, TreeState, Id, DropZone } from '../types';

// TreeState에서 Todo[] 배열로 변환
export function todosToTreeState(todos: Todo[]): TreeState {
  const nodes: Record<Id, Todo> = {};
  const rootOrder: Id[] = [];
  const children: Record<Id, Id[]> = {};

  // 노드 맵 생성
  todos.forEach(todo => {
    nodes[todo.id] = todo;
  });

  // 루트와 자식 분리 및 정렬
  todos
    .filter(todo => !todo.parent_id) // 부모 (루트) 노드들
    .sort((a, b) => a.display_order - b.display_order)
    .forEach(todo => {
      rootOrder.push(todo.id);
    });

  // 각 부모의 자식들 정리
  todos
    .filter(todo => todo.parent_id) // 자식 노드들
    .forEach(todo => {
      const parentId = todo.parent_id!;
      if (!children[parentId]) {
        children[parentId] = [];
      }
      children[parentId].push(todo.id);
    });

  // 자식들을 display_order로 정렬
  Object.keys(children).forEach(parentId => {
    children[parentId].sort((a, b) =>
      nodes[a].display_order - nodes[b].display_order
    );
  });

  return { nodes, rootOrder, children };
}

// TreeState에서 Todo[] 배열로 변환
export function treeStateToTodos(state: TreeState): Todo[] {
  return Object.values(state.nodes);
}

// 배열에서 요소 제거
function removeFromArray<T>(array: T[], item: T): T[] {
  return array.filter(x => x !== item);
}

// 배열의 특정 위치에 요소 삽입
function insertAtIndex<T>(array: T[], index: number, item: T): T[] {
  const newArray = [...array];
  newArray.splice(index, 0, item);
  return newArray;
}

// 배열 끝에 요소 추가
function insertAtEnd<T>(array: T[], item: T): T[] {
  return [...array, item];
}

// target 앞/뒤에 item 삽입
function insertBeforeOrAfter<T>(array: T[], target: T, item: T, position: 'before' | 'after'): T[] {
  const targetIndex = array.indexOf(target);
  if (targetIndex === -1) return insertAtEnd(array, item);

  const insertIndex = position === 'before' ? targetIndex : targetIndex + 1;
  return insertAtIndex(array, insertIndex, item);
}

// 특정 위치에서 드래그된 아이템 분리
function detachFromTree(state: TreeState, dragId: Id): TreeState {
  const dragNode = state.nodes[dragId];
  if (!dragNode) return state;

  const newState = {
    nodes: { ...state.nodes },
    rootOrder: [...state.rootOrder],
    children: { ...state.children }
  };

  if (dragNode.parent_id) {
    // 자식에서 제거
    const parentId = dragNode.parent_id;
    if (newState.children[parentId]) {
      newState.children[parentId] = removeFromArray(newState.children[parentId], dragId);
      if (newState.children[parentId].length === 0) {
        delete newState.children[parentId];
      }
    }
  } else {
    // 루트에서 제거
    newState.rootOrder = removeFromArray(newState.rootOrder, dragId);
  }

  return newState;
}

// display_order 재계산
function recalculateDisplayOrder(state: TreeState): TreeState {
  const newNodes = { ...state.nodes };

  // 루트 노드들 순서 업데이트
  state.rootOrder.forEach((id, index) => {
    newNodes[id] = {
      ...newNodes[id],
      display_order: index
    };
  });

  // 자식 노드들 순서 업데이트
  Object.entries(state.children).forEach(([, childIds]) => {
    childIds.forEach((id, index) => {
      newNodes[id] = {
        ...newNodes[id],
        display_order: index
      };
    });
  });

  return {
    ...state,
    nodes: newNodes
  };
}

// 메인 이동 함수
export function moveTodo(
  state: TreeState,
  dragId: Id,
  targetId: Id | null,
  zone: DropZone
): TreeState {
  // 기본 검증
  if (!targetId && zone !== 'root') return state;
  if (dragId === targetId) return state;

  const dragNode = state.nodes[dragId];
  const targetNode = targetId ? state.nodes[targetId] : null;

  if (!dragNode) return state;

  // 헬퍼 함수
  const isParent = (node: Todo) => !node.parent_id;

  // 1) 현재 위치에서 분리
  let newState = detachFromTree(state, dragId);

  if (zone === 'root') {
    // 루트로 이동 (부모로 승격)
    newState.nodes[dragId] = {
      ...newState.nodes[dragId],
      parent_id: null
    };
    newState.rootOrder = insertAtEnd(newState.rootOrder, dragId);
    return recalculateDisplayOrder(newState);
  }

  // zone: inside/before/after
  if (!targetNode) return state;

  if (zone === 'inside') {
    if (isParent(targetNode)) {
      // 부모의 마지막 자식으로 이동
      newState.nodes[dragId] = {
        ...newState.nodes[dragId],
        parent_id: targetNode.id
      };
      if (!newState.children[targetNode.id]) {
        newState.children[targetNode.id] = [];
      }
      newState.children[targetNode.id] = insertAtEnd(newState.children[targetNode.id], dragId);
      return recalculateDisplayOrder(newState);
    } else {
      // 자식에 inside -> after sibling으로 보정
      const parentId = targetNode.parent_id!;
      newState.nodes[dragId] = {
        ...newState.nodes[dragId],
        parent_id: parentId
      };
      if (!newState.children[parentId]) {
        newState.children[parentId] = [];
      }
      newState.children[parentId] = insertBeforeOrAfter(
        newState.children[parentId],
        targetId!,
        dragId,
        'after'
      );
      return recalculateDisplayOrder(newState);
    }
  }

  if (zone === 'before' || zone === 'after') {
    if (isParent(targetNode)) {
      // 루트 레벨에서 정렬 (부모로 승격 필요시)
      newState.nodes[dragId] = {
        ...newState.nodes[dragId],
        parent_id: null
      };
      newState.rootOrder = insertBeforeOrAfter(
        newState.rootOrder,
        targetId!,
        dragId,
        zone
      );
      return recalculateDisplayOrder(newState);
    } else {
      // 자식 레벨에서 정렬
      const parentId = targetNode.parent_id!;

      // 부모를 자식 레벨로 강등하는 것은 금지 (명시성 원칙)
      if (isParent(dragNode)) {
        return state; // no-op
      }

      newState.nodes[dragId] = {
        ...newState.nodes[dragId],
        parent_id: parentId
      };
      if (!newState.children[parentId]) {
        newState.children[parentId] = [];
      }
      newState.children[parentId] = insertBeforeOrAfter(
        newState.children[parentId],
        targetId!,
        dragId,
        zone
      );
      return recalculateDisplayOrder(newState);
    }
  }

  return newState;
}

// 드롭 유효성 검사
export function isValidDrop(
  state: TreeState,
  dragId: Id,
  targetId: Id | null,
  zone: DropZone
): boolean {
  if (!targetId && zone !== 'root') return false;
  if (dragId === targetId) return false;

  const dragNode = state.nodes[dragId];
  const targetNode = targetId ? state.nodes[targetId] : null;

  if (!dragNode) return false;

  // 자기 자신에게 드롭 금지
  if (dragId === targetId) return false;

  // 자식이 부모를 포함할 수 없음 (순환 참조 방지)
  if (zone === 'inside' && targetNode && targetNode.parent_id === dragId) {
    return false;
  }

  return true;
}

// 유틸리티: 드롭존 위치 계산 (UI용)
export function calculateDropZone(
  mouseY: number,
  elementTop: number,
  elementHeight: number,
  targetIsParent: boolean
): 'before' | 'inside' | 'after' {
  const relativeY = mouseY - elementTop;
  const third = elementHeight / 3;

  if (relativeY < third) {
    return 'before';
  } else if (relativeY > third * 2) {
    return 'after';
  } else {
    return targetIsParent ? 'inside' : 'after'; // 자식의 중간은 after로 보정
  }
}