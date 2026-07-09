// Generic, presentation-only UI atoms. Every function returns an HTML
// string. Interactivity is wired via data-click/data-input/data-change/
// data-keydown/data-mousedown="actionName|arg1|arg2" attributes, dispatched
// by the single delegated listener set up in app.js — components never
// touch the store directly.
(function (global) {
  "use strict";

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function attr(name, value) {
    return value == null ? "" : ' ' + name + '="' + esc(value) + '"';
  }

  function act(type, id, args) {
    if (!id) return "";
    const parts = [id].concat(args || []);
    return " data-" + type + '="' + esc(parts.join("|")) + '"';
  }

  function Button(o) {
    o = o || {};
    const hierarchy = o.hierarchy || "secondary";
    const cls = ["btn", "btn-" + hierarchy, o.size === "sm" ? "sm" : "", o.destructive ? "btn-destructive" : ""]
      .filter(Boolean)
      .join(" ");
    return (
      '<button type="button" class="' + cls + '"' +
      (o.disabled ? " disabled" : "") +
      act("click", o.click, o.args) +
      attr("aria-label", o.ariaLabel) +
      (o.style ? attr("style", o.style) : "") +
      ">" +
      (o.iconLeft ? ICON(o.iconLeft, 18) : "") +
      (o.label != null ? "<span>" + o.label + "</span>" : "") +
      "</button>"
    );
  }

  function IconButton(o) {
    o = o || {};
    const cls = ["icon-btn", o.hierarchy || "tertiary", o.size === "sm" ? "sm" : ""].filter(Boolean).join(" ");
    return (
      '<button type="button" class="' + cls + '"' +
      act("click", o.click, o.args) +
      act("mousedown", o.mousedown, o.mousedownArgs) +
      attr("aria-label", o.ariaLabel) +
      (o.disabled ? " disabled" : "") +
      ">" +
      (o.iconName ? ICON(o.iconName, o.iconSize || 16) : o.iconHtml || "") +
      "</button>"
    );
  }

  function NavItem(o) {
    o = o || {};
    return (
      '<button type="button" class="nav-item' + (o.active ? " active" : "") + '"' +
      act("click", o.click, o.args) +
      attr("aria-label", o.collapsed ? o.label : null) +
      attr("title", o.collapsed ? o.label : null) +
      ">" +
      (o.iconHtml || ICON(o.icon, 18)) +
      (o.collapsed ? "" : "<span>" + esc(o.label) + "</span>") +
      "</button>"
    );
  }

  function Checkbox(o) {
    o = o || {};
    return (
      '<label class="checkbox-wrap">' +
      '<span class="checkbox' + (o.checked ? " checked" : "") + '" role="checkbox" tabindex="0" aria-checked="' + (o.checked ? "true" : "false") + '"' +
      act("click", o.click, o.args) +
      act("keydown", "checkboxKey", o.args ? [o.click].concat(o.args) : [o.click]) +
      ">" + (o.checked ? ICON("check", 13) : "") + "</span>" +
      (o.label ? '<span class="checkbox-label">' + esc(o.label) + "</span>" : "") +
      "</label>"
    );
  }

  function Toggle(o) {
    o = o || {};
    return (
      '<button type="button" role="switch" aria-checked="' + (o.checked ? "true" : "false") + '" class="toggle' +
      (o.checked ? " checked" : "") + '"' +
      act("click", o.click, o.args) +
      attr("aria-label", o.ariaLabel) +
      '><span class="knob"></span></button>'
    );
  }

  function Select(o) {
    o = o || {};
    const current = (o.options || []).find((x) => x.value === o.value);
    const open = o.open;
    return (
      '<div class="select-wrap" data-select-key="' + esc(o.fieldKey) + '"' + (o.style ? attr("style", o.style) : "") + '>' +
      '<button type="button" class="select-btn"' + act("click", "toggleSelect", [o.fieldKey]) + ' aria-haspopup="listbox" aria-expanded="' + (open ? "true" : "false") + '">' +
      "<span>" + esc(current ? current.label : "") + "</span>" +
      ICON("chevronDown", 16) +
      "</button>" +
      (open
        ? '<div class="date-popover-mask" data-click="closeSelect"></div><div class="select-menu" role="listbox">' +
          (o.options || [])
            .map(
              (opt) =>
                '<button type="button" role="option" class="' +
                (opt.value === o.value ? "active" : "") +
                '"' +
                act("click", o.onChange, [o.fieldKey, opt.value]) +
                ">" +
                esc(opt.label) +
                "</button>"
            )
            .join("") +
          "</div>"
        : "") +
      "</div>"
    );
  }

  function SegmentedControl(o) {
    o = o || {};
    return (
      '<div class="segmented">' +
      (o.options || [])
        .map(
          (opt) =>
            '<button type="button" class="' +
            (opt.value === o.value ? "active" : "") +
            '"' +
            act("click", o.onChange, [opt.value]) +
            ">" +
            esc(opt.label) +
            "</button>"
        )
        .join("") +
      "</div>"
    );
  }

  function Tabs(o) {
    o = o || {};
    return (
      '<div class="tabs" role="tablist">' +
      (o.tabs || [])
        .map(
          (t) =>
            '<button type="button" role="tab" aria-selected="' + (t.value === o.value ? "true" : "false") + '" class="' +
            (t.value === o.value ? "active" : "") +
            '"' +
            act("click", o.onChange, [t.value]) +
            ">" +
            esc(t.label) +
            "</button>"
        )
        .join("") +
      "</div>"
    );
  }

  function Badge(o) {
    o = o || {};
    return '<span class="badge ' + (o.color || "") + '">' + esc(o.label) + "</span>";
  }

  function FeaturedIcon(o) {
    o = o || {};
    return '<span class="featured-icon">' + ICON(o.icon, 20) + "</span>";
  }

  function EmptyState(o) {
    o = o || {};
    return (
      '<div class="empty-state">' +
      '<span class="icon-wrap">' + ICON(o.icon, 22) + "</span>" +
      '<div class="title">' + esc(o.title) + "</div>" +
      '<div class="desc">' + esc(o.description) + "</div>" +
      "</div>"
    );
  }

  function Pagination() {
    return (
      '<div class="pagination">' +
      '<button type="button" disabled>' + ICON("chevronLeft", 14) + "</button>" +
      '<button type="button" class="active">1</button>' +
      '<button type="button" disabled>' + ICON("chevronRight", 14) + "</button>" +
      "</div>"
    );
  }

  function Breadcrumb(items) {
    return (
      '<div class="breadcrumb">' +
      (items || [])
        .map((it, i) => {
          const isLast = i === (items.length - 1);
          if (isLast) return '<span class="current">' + esc(it.label) + "</span>";
          return '<a' + act("click", it.click, it.args) + '>' + esc(it.label) + "</a><span>/</span>";
        })
        .join("") +
      "</div>"
    );
  }

  function Modal(o) {
    o = o || {};
    if (!o.open) return "";
    const w = o.width ? o.width + "px" : "560px";
    return (
      '<div class="modal-mask"' + act("click", "modalMaskClick", [o.id || ""]) + '>' +
      '<div class="modal-box" style="width:' + w + ';" role="dialog" aria-modal="true"' + act("click", "stop", []) + attr("aria-label", o.title) + '>' +
      '<div class="modal-head">' +
      '<div style="display:flex;align-items:flex-start;gap:2px;min-width:0;">' +
      (o.icon ? '<span class="modal-head-icon">' + ICON(o.icon, 20) + "</span>" : "") +
      '<div style="min-width:0;">' +
      '<h2 class="modal-title">' + esc(o.title) + "</h2>" +
      (o.description ? '<p class="modal-desc">' + esc(o.description) + "</p>" : "") +
      "</div></div>" +
      '<div class="modal-close">' + IconButton({ iconName: "close", ariaLabel: "Close", hierarchy: "tertiary", size: "sm", click: "closeModal", args: [o.id || ""] }) + "</div>" +
      "</div>" +
      '<div class="modal-body"' + (o.bodyHeight ? attr("style", "height:" + o.bodyHeight + "px;") : "") + ">" +
      (o.bodyHtml || "") +
      "</div>" +
      "</div>" +
      "</div>"
    );
  }

  function Dropzone(o) {
    o = o || {};
    if (o.fileName) {
      return (
        '<div class="dropzone-file">' +
        ICON("document", 22) +
        '<span class="name">' + esc(o.fileName) + "</span>" +
        IconButton({ iconName: "close", ariaLabel: "Remove file", hierarchy: "tertiary", size: "sm", click: "clearUploadFile" }) +
        "</div>"
      );
    }
    return (
      '<label class="dropzone"' + act("click", "noop", []) + '>' +
      '<input type="file" accept="audio/*" style="display:none;" data-change="uploadFilePicked" />' +
      ICON("import", 26) +
      '<div class="main">Click to upload</div>' +
      '<div class="hint">or drag and drop</div>' +
      '<div class="hint">MP3, WAV, M4A, FLAC up to 500MB</div>' +
      "</label>"
    );
  }

  global.UI = {
    esc, attr, act,
    Button, IconButton, NavItem, Checkbox, Toggle, Select, SegmentedControl,
    Tabs, Badge, FeaturedIcon, EmptyState, Pagination, Breadcrumb, Modal, Dropzone,
  };
})(window);
