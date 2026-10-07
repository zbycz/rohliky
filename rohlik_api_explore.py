"""Rohlik.cz category-tree + category listing (reverse-engineered public API).

Endpoints used (no login required for these):
  GET /api/v1/categories/{type}/subcategories              -> top-level category IDs
  GET /api/v1/categories/{type}/{categoryId}/subcategories -> child category IDs
  GET /api/v1/categories?categories={id}&...&type={type}   -> name/slug/title
  GET /api/v1/categories/{type}/{categoryId}/products      -> paginated product IDs
  GET /api/v1/products/card?products={id}&...              -> product details (prices)

Prices/assortment depend on the selected delivery address (cookie), so anonymous
results are generic (Prague).
"""

import json
import urllib.request
import urllib.parse

BASE = "https://www.rohlik.cz"
UA = {"User-Agent": "Mozilla/5.0"}

SORTS = ["recommended", "price-asc", "price-desc", "unit-price-asc"]


def get(path):
    req = urllib.request.Request(BASE + path, headers=UA)
    return json.load(urllib.request.urlopen(req, timeout=20))


def category_names(ids, ctype="normal"):
    if not ids:
        return {}
    q = "".join(f"categories={i}&" for i in ids) + f"type={ctype}"
    return {c["categoryId"]: c for c in get(f"/api/v1/categories?{q}")}


def subcategories(category_id=None, ctype="normal"):
    suffix = f"/{category_id}" if category_id else ""
    data = get(f"/api/v1/categories/{ctype}{suffix}/subcategories")
    return data.get("categoryIds", [])


def category_products(category_id, ctype="normal", page=0, size=50, sort="unit-price-asc"):
    q = urllib.parse.urlencode({
        "page": page, "size": size, "sort": sort,
        "filter": "", "excludeProductIds": "",
    })
    data = get(f"/api/v1/categories/{ctype}/{category_id}/products?{q}")
    ids = data.get("productIds", [])
    if not ids:
        return []
    cards_q = "".join(f"products={i}&" for i in ids) + f"categoryType={ctype}"
    cards = get(f"/api/v1/products/card?{cards_q}")
    by_id = {c["productId"]: c for c in cards}
    return [by_id[i] for i in ids if i in by_id]


def dump_tree(max_level=1, ctype="normal"):
    root = subcategories(ctype=ctype)
    meta = category_names(root, ctype)
    tree = {}
    for cid in root:
        node = {"name": meta.get(cid, {}).get("name"), "slug": meta.get(cid, {}).get("slug"),
                "children": []}
        if max_level >= 1:
            kids = subcategories(cid, ctype)
            kmeta = category_names(kids, ctype)
            node["children"] = [{"id": k, "name": kmeta.get(k, {}).get("name")} for k in kids]
        tree[cid] = node
    return tree


if __name__ == "__main__":
    tree = dump_tree(max_level=1)
    print(f"Top-level categories: {len(tree)}")
    for cid, node in tree.items():
        print(f"  {node['name']:30s} id={cid} -> {len(node['children'])} children")
    json.dump(tree, open("rohlik_categories.json", "w"), ensure_ascii=False, indent=1)

    leaf = 300105049  # Máslo (butter)
    print(f"\nMáslo (id={leaf}) sorted by unit price asc:")
    for c in category_products(leaf, page=0, size=5, sort="unit-price-asc"):
        p = c.get("prices", {})
        print(f"  {str(c.get('name'))[:38]:38s} unit={p.get('unitPrice')} "
              f"sale={p.get('salePrice')} orig={p.get('originalPrice')} /{c.get('unit')}")
