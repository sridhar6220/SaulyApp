// Inline stroke-icon set (24x24 viewBox, stroke=currentColor) matching the
// design's icon language. ICON(name, size) returns raw SVG markup.
(function (global) {
  "use strict";

  const PATHS = {
    home: '<path d="M4 10.5L12 4l8 6.5"></path><path d="M6 9.5V19a1 1 0 0 0 1 1h3v-5a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v5h3a1 1 0 0 0 1-1V9.5"></path>',
    briefcase: '<rect x="3.5" y="7.5" width="17" height="11.5" rx="2"></rect><path d="M8.5 7.5V6a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v1.5"></path><path d="M3.5 12.5h17"></path>',
    gear: '<circle cx="12" cy="12" r="3"></circle><path d="M12 3.5v2M12 18.5v2M20.5 12h-2M5.5 12h-2M17.7 6.3l-1.4 1.4M7.7 16.3l-1.4 1.4M17.7 17.7l-1.4-1.4M7.7 7.7L6.3 6.3"></path>',
    gearHex: '<path d="M12 3.2l7.6 4.4v8.8L12 20.8 4.4 16.4V7.6L12 3.2z"></path><circle cx="12" cy="12" r="3.3"></circle>',
    plug: '<path d="M9 2v4M15 2v4"></path><path d="M7 6h10v4a5 5 0 0 1-10 0V6z"></path><path d="M12 15v3a3 3 0 0 0 3 3h1"></path>',
    flask: '<path d="M9 3h6"></path><path d="M10 3v6L5 19a1.5 1.5 0 0 0 1.3 2.2h11.4A1.5 1.5 0 0 0 19 19l-5-10V3"></path><path d="M7.5 14h9"></path>',
    chevronDown: '<path d="M6 9l6 6 6-6"></path>',
    chevronUp: '<path d="M6 15l6-6 6 6"></path>',
    chevronLeft: '<path d="M15 6l-6 6 6 6"></path>',
    chevronRight: '<path d="M9 6l6 6-6 6"></path>',
    calendar: '<rect x="3.5" y="5" width="17" height="15.5" rx="2.5"></rect><path d="M8 3v4M16 3v4M3.5 10h17"></path>',
    plus: '<path d="M12 5v14M5 12h14"></path>',
    check: '<path d="M5 12.5l4.5 4.5L19 7"></path>',
    close: '<path d="M6 6l12 12M18 6L6 18"></path>',
    copy: '<rect x="8.5" y="8.5" width="11" height="11" rx="2"></rect><path d="M15 8.5V6.5a2 2 0 0 0-2-2H6.5a2 2 0 0 0-2 2V13a2 2 0 0 0 2 2H8.5"></path>',
    import: '<path d="M12 3.5v11"></path><path d="M7.5 10.5L12 15l4.5-4.5"></path><path d="M4.5 16.5V18a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-1.5"></path>',
    bookmark: '<path d="M6.5 4h11a1 1 0 0 1 1 1v15l-6.5-4-6.5 4V5a1 1 0 0 1 1-1z"></path>',
    clipboard: '<rect x="5.5" y="5" width="13" height="16" rx="2"></rect><path d="M9 5a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 5v1H9V5z"></path><path d="M8.5 11.5h7M8.5 15.5h7"></path>',
    edit: '<path d="M14.5 4.5l5 5L8 21H3v-5L14.5 4.5z"></path><path d="M12.5 6.5l5 5"></path>',
    mic: '<rect x="9" y="3" width="6" height="11" rx="3"></rect><path d="M5.5 11a6.5 6.5 0 0 0 13 0"></path><path d="M12 17.5V21M9 21h6"></path>',
    document: '<path d="M7 3.5h7l4 4v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-16a1 1 0 0 1 1-1z"></path><path d="M14 3.5v4h4"></path><path d="M9 13h6M9 16.5h6"></path>',
    note: '<path d="M6 3.5h9.5L19 7v13.5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1z"></path><path d="M8.5 9.5h7M8.5 13h7M8.5 16.5h4.5"></path>',
    chartSquare: '<rect x="3.5" y="3.5" width="17" height="17" rx="3"></rect><path d="M8 15.5v-3M12 15.5v-6M16 15.5v-4.5"></path>',
    sun: '<circle cx="12" cy="12" r="4.5"></circle><path d="M12 2.5v2.5M12 19v2.5M4.7 4.7l1.8 1.8M17.5 17.5l1.8 1.8M2.5 12H5M19 12h2.5M4.7 19.3l1.8-1.8M17.5 6.5l1.8-1.8"></path>',
    moon: '<path d="M20 14.5A8.5 8.5 0 019.5 4a8.5 8.5 0 1010.5 10.5z"></path>',
    fourArrows: '<path d="M12 3v18M3 12h18M12 3l-3 3M12 3l3 3M12 21l-3-3M12 21l3-3M3 12l3-3M3 12l3 3M21 12l-3-3M21 12l-3 3"></path>',
    search: '<circle cx="10.5" cy="10.5" r="6.5"></circle><path d="M20 20l-4.35-4.35"></path>',
    trash: '<path d="M5 7h14M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M7 7l1 13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1l1-13"></path>',
    add: '<path d="M12 5v14M5 12h14"></path>',
  };

  function ICON(name, size) {
    size = size || 18;
    const inner = PATHS[name] || "";
    return (
      '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" ' +
      'stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;display:block;">' +
      inner +
      "</svg>"
    );
  }

  global.ICON = ICON;
})(window);
