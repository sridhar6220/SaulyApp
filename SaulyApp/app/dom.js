// Tiny DOM-morphing renderer: given a container and a fresh HTML string,
// patches the existing DOM in place instead of clobbering it. This is what
// keeps text-input cursors, contenteditable selections and scroll position
// stable across re-renders without a full framework.
(function (global) {
  "use strict";

  function keyOf(node) {
    return node.nodeType === Node.ELEMENT_NODE ? node.getAttribute("data-key") : null;
  }

  function syncAttrs(oldEl, newEl) {
    const oldAttrs = oldEl.attributes;
    for (let i = oldAttrs.length - 1; i >= 0; i--) {
      const name = oldAttrs[i].name;
      if (!newEl.hasAttribute(name)) oldEl.removeAttribute(name);
    }
    const newAttrs = newEl.attributes;
    for (let i = 0; i < newAttrs.length; i++) {
      const name = newAttrs[i].name;
      const val = newAttrs[i].value;
      if (oldEl.getAttribute(name) !== val) oldEl.setAttribute(name, val);
    }
  }

  function morphNode(oldNode, newNode) {
    if (oldNode.nodeType !== newNode.nodeType || oldNode.nodeName !== newNode.nodeName) {
      oldNode.replaceWith(newNode);
      return newNode;
    }
    if (oldNode.nodeType === Node.TEXT_NODE || oldNode.nodeType === Node.COMMENT_NODE) {
      if (oldNode.nodeValue !== newNode.nodeValue) oldNode.nodeValue = newNode.nodeValue;
      return oldNode;
    }
    if (oldNode.nodeType !== Node.ELEMENT_NODE) return oldNode;

    syncAttrs(oldNode, newNode);

    const tag = oldNode.tagName;
    const isFocused = document.activeElement === oldNode;

    if (tag === "INPUT" || tag === "TEXTAREA") {
      if (!isFocused && oldNode.value !== newNode.value) oldNode.value = newNode.value;
      if (oldNode.checked !== newNode.checked) oldNode.checked = newNode.checked;
      return oldNode;
    }

    if (oldNode.hasAttribute("contenteditable")) {
      // Content is owned by the app after first hydration (see hydrateEditors);
      // never overwrite it here or we'd blow away the caret/selection.
      return oldNode;
    }

    morphChildren(oldNode, newNode);
    return oldNode;
  }

  function morphChildren(oldParent, newParent) {
    const oldChildrenAll = Array.from(oldParent.childNodes);
    const newChildren = Array.from(newParent.childNodes);
    const usedOld = new Set();
    const oldKeyed = new Map();
    oldChildrenAll.forEach((c) => {
      const k = keyOf(c);
      if (k != null) oldKeyed.set(k, c);
    });

    let searchStart = 0;
    let refNode = oldParent.firstChild;

    newChildren.forEach((newChild) => {
      const k = keyOf(newChild);
      let matched = null;

      if (k != null && oldKeyed.has(k) && !usedOld.has(oldKeyed.get(k))) {
        matched = oldKeyed.get(k);
      } else if (k == null) {
        for (let i = searchStart; i < oldChildrenAll.length; i++) {
          const cand = oldChildrenAll[i];
          if (usedOld.has(cand)) continue;
          if (keyOf(cand) != null) continue;
          if (cand.nodeType === newChild.nodeType && cand.nodeName === newChild.nodeName) {
            matched = cand;
            break;
          }
        }
      }

      if (matched) {
        usedOld.add(matched);
        const result = morphNode(matched, newChild);
        if (result !== refNode) {
          oldParent.insertBefore(result, refNode);
        } else {
          refNode = refNode.nextSibling;
        }
      } else {
        oldParent.insertBefore(newChild, refNode);
      }
    });

    oldChildrenAll.forEach((c) => {
      if (!usedOld.has(c) && c.parentNode === oldParent) {
        oldParent.removeChild(c);
      }
    });
  }

  function morph(container, html) {
    const tmp = document.createElement(container.tagName === "TBODY" ? "tbody" : "div");
    tmp.innerHTML = html;
    morphChildren(container, tmp);
  }

  global.DomMorph = { morph };
})(window);
