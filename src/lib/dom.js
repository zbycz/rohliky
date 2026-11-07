export const Fragment = Symbol("Fragment");

export function h(type, props, ...children) {
  return { type, props: props || {}, children: children.flat(Infinity) };
}

function applyProps(el, props) {
  for (const key of Object.keys(props)) {
    const value = props[key];
    if (key === "ref") {
      if (typeof value === "function") value(el);
      continue;
    }
    if (value == null || value === false) continue;
    if (key === "class" || key === "className") {
      el.className = value;
    } else if (key === "style" && typeof value === "object") {
      Object.assign(el.style, value);
    } else if (key.startsWith("on") && typeof value === "function") {
      el.addEventListener(key.slice(2).toLowerCase(), value);
    } else if (key === "value") {
      el.value = value;
    } else if (key === "checked") {
      el.checked = Boolean(value);
    } else if (key === "html") {
      el.innerHTML = value;
    } else if (value === true) {
      el.setAttribute(key, "");
    } else {
      el.setAttribute(key, value);
    }
  }
}

function createNode(vnode) {
  if (vnode == null || vnode === false || vnode === true || vnode === "") {
    return document.createComment("");
  }
  if (Array.isArray(vnode)) {
    return createFragment(vnode);
  }
  if (typeof vnode === "string" || typeof vnode === "number") {
    return document.createTextNode(String(vnode));
  }
  if (typeof vnode.type === "function") {
    return createNode(vnode.type(vnode.props, vnode.children));
  }
  if (vnode.type === Fragment) {
    return createFragment(vnode.children);
  }
  const el = document.createElement(vnode.type);
  applyProps(el, vnode.props);
  for (const child of vnode.children) {
    el.appendChild(createNode(child));
  }
  return el;
}

function createFragment(children) {
  const fragment = document.createDocumentFragment();
  for (const child of children) {
    fragment.appendChild(createNode(child));
  }
  return fragment;
}

export function render(vnode, container) {
  container.replaceChildren(createNode(vnode));
}

export function mount(component, props, container) {
  render(component(props), container);
}
