export interface CategoryTreeNode {
  id: string;
  slug: string;
  name: string;
  image: string;
  providerCount: number;
  serviceCount?: number;
  children?: CategoryTreeNode[];
}

// get_categories_hierarchical names the display field `category_name` at the
// top level but `name` on nested children — both are covered here.
export interface CategoryHierarchicalApi {
  id: string;
  slug: string;
  category_name?: string;
  name?: string;
  translated_name: string;
  image: string;
  sort_order: string;
  children: CategoryHierarchicalApi[] | null;
}

export interface CategoriesHierarchicalResponse {
  error: boolean;
  message: string;
  data: CategoryHierarchicalApi[];
  code: number;
}

export function toCategoryTreeNode(node: CategoryHierarchicalApi): CategoryTreeNode {
  return {
    id: node.id,
    slug: node.slug,
    name: node.translated_name || node.category_name || node.name || "",
    image: node.image,
    providerCount: 0,
    children: node.children?.map(toCategoryTreeNode),
  };
}

// A selected parent-category slug has to be expanded to itself + every
// descendant slug before it reaches the listing API — the API filters by
// exact slug match, with no "include children" semantics of its own, so a
// bare parent slug comes back "Data not found" even though providers/services
// exist under its children.
export function expandCategorySlugs(tree: CategoryTreeNode[], slugs: string[]): string[] {
  if (slugs.length === 0) return slugs;

  const collectDescendantSlugs = (node: CategoryTreeNode): string[] => {
    if (!node.children || node.children.length === 0) return [node.slug];
    return [node.slug, ...node.children.flatMap(collectDescendantSlugs)];
  };

  const findNode = (nodes: CategoryTreeNode[], slug: string): CategoryTreeNode | undefined => {
    for (const node of nodes) {
      if (node.slug === slug) return node;
      const found = node.children && findNode(node.children, slug);
      if (found) return found;
    }
    return undefined;
  };

  const expanded = slugs.flatMap((slug) => {
    const node = findNode(tree, slug);
    return node ? collectDescendantSlugs(node) : [slug];
  });

  return Array.from(new Set(expanded));
}
