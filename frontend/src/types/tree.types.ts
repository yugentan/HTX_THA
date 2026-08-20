// A task being composed in a tree like structure before it gets created on the server.
export type TaskTree = {
  key: string;
  title: string;
  skills: string[];
  children: TaskTree[];
};

export const SKILL_OPTIONS = ["Backend", "Frontend"];

let counter = 0;

export const newTree = (): TaskTree => ({
  key: `Tree-${(counter += 1)}`,
  title: "",
  skills: [],
  children: [],
});

// Replaces the node with the given key case for 1.1 1.2 and 1.1 got remove 1.2 becomes 1.1
export const updateTree = (
  node: TaskTree,
  key: string,
  change: (found: TaskTree) => TaskTree
): TaskTree => {
  if (node.key === key) {
    return change(node);
  }

  return {
    ...node,
    children: node.children.map((child) => updateTree(child, key, change)),
  };
};

// Drops the node with the given key from anywhere in the tree
export const removeTree = (node: TaskTree, key: string): TaskTree => ({
  ...node,
  children: node.children
    .filter((child) => child.key !== key)
    .map((child) => removeTree(child, key)),
});

// Labelling to append 1.1, 1.2 ... etc from each node's position among siblings
export const TreeLabel = (path: number[]): string =>
  path.map((index) => index + 1).join(".");
