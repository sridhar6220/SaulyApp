(function () {
  "use strict";
  const store = new Store();
  const root = document.getElementById("app");

  // ── action dispatch table ──────────────────────────────────────────
  const H = {
    noop() {},
    stop() {},
    preventFocusSteal(e) { e.preventDefault(); },

    goToDashboard() { store.goToDashboard(); },
    goToMeetingsNav() { store.goToMeetingsNav(); },
    goToSettings() { store.goToSettings(); },
    backToList() { store.backToList(); },
    toggleSidebar() { store.toggleSidebar(); },
    toggleTheme() { store.toggleTheme(); },
    setTheme(e, v) { store.setTheme(v); },

    setSort(e, key) { store.setSort(key); },
    setQuery(e) { store.setQuery(e.target.value); },
    setPlatformFilter(e, v) { store.setPlatformFilter(v); },
    toggleDateCard() { store.toggleDateCard(); },
    closeDateModal() { store.closeDateModal(); },
    clearDateRange() { store.clearDateRange(); },
    dateFromChange(e) { store.setDateFrom(e.target.value); },
    dateToChange(e) { store.setDateTo(e.target.value); },

    toggleSelect(e, key) { store.toggleSelect(key); },
    closeSelect() { store.closeSelect(); },
    selectSetting(e, key, value) { store.selectSetting(key, value); },
    chooseTranscriptionModel(e, key, value) { store.setTranscriptionModel(value); },
    chooseSummaryModel(e, key, value) { store.setSummaryModel(value); },
    chooseUploadPlatform(e, key, value) { store.setUploadPlatform(value); },
    pinSummaryLang(e, value) { store.pinSummaryLang(value); },
    toggleSetting(e, key) { store.updateSetting(key, !store.state.settings[key]); },
    settingsInput(e, key) { store.updateSetting(key, e.target.value); },
    setSettingsSection(e, id) { store.setSettingsSection(id); },
    toggleConnector(e, id) { store.toggleConnector(id); },

    toggleExpand(e, id) { store.toggleExpand(id); },
    toggleExpandStop(e, id) { e.stopPropagation(); store.toggleExpand(id); },
    toggleExpandKey(e, id) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); store.toggleExpand(id); } },
    openDetailModal(e, id) { store.openDetailModal(id); },
    closeDetailModal() { store.closeDetailModal(); },
    closeModal(e, id) { if (id === "upload") store.closeUploadModal(); else store.closeDetailModal(); },
    modalMaskClick(e, id) { if (id === "upload") store.closeUploadModal(); else store.closeDetailModal(); },
    setDetailTab(e, v) { store.setDetailTab(v); },
    copySummary(e, id) {
      const m = store.state.meetings.find((x) => x.id === id);
      if (m) store.copySummary(m);
    },

    startLiveSession() { store.startLiveSession(); },
    endLiveSession() { store.endLiveSession(); },
    openUploadModal() { store.openUploadModal(); },
    closeUploadModal() { store.closeUploadModal(); },
    clearUploadFile() { store.clearUploadFile(); },
    uploadTitleInput(e) { store.setUploadTitle(e.target.value); },
    uploadCompanyInput(e) { store.setUploadCompany(e.target.value); },
    submitUpload() { store.submitUpload(); },
    uploadFilePicked(e) {
      const f = e.target.files && e.target.files[0];
      if (f) store.setUploadFile(f);
    },

    toggleActionItem(e, meetingId, itemId) { store.toggleActionItem(meetingId, itemId); },
    startEdit(e, meetingId, itemId) { store.startEdit(meetingId, itemId); },
    setEditDraft(e) { store.setEditDraft(e.target.value); },
    saveEdit() { store.saveEdit(); },
    editDraftKeydown(e) {
      if (e.key === "Enter") { e.preventDefault(); store.saveEdit(); }
      else if (e.key === "Escape") { e.preventDefault(); store.cancelEdit(); }
    },
    removeActionItem(e, meetingId, itemId) { store.removeActionItem(meetingId, itemId); },
    setNewItemDraft(e) { store.setNewItemDraft(e.target.value); },
    newItemKeydown(e, meetingId) {
      if (e.key === "Enter") { e.preventDefault(); store.addActionItem(meetingId); }
    },
    addActionItem(e, meetingId) { store.addActionItem(meetingId); },

    checkboxKey(e, actionId) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        const args = Array.prototype.slice.call(arguments, 2);
        H[actionId] && H[actionId].apply(null, [e].concat(args));
      }
    },

    commentsInput(e) {
      const id = e.target.getAttribute("data-meeting-id");
      store.setComments(id, e.target.innerHTML);
    },
    applyFormat(e, type) {
      const block = e.target.closest(".comments-block");
      if (!block) return;
      const editor = block.querySelector("[contenteditable]");
      if (!editor) return;
      editor.focus();
      const cmd = { bold: "bold", italic: "italic", bullet: "insertUnorderedList", numbered: "insertOrderedList" }[type];
      try { document.execCommand(cmd, false, null); } catch (err) {}
      store.setComments(editor.getAttribute("data-meeting-id"), editor.innerHTML);
    },
  };

  // ── delegated event dispatch ────────────────────────────────────────
  function dispatch(type) {
    return function (e) {
      const el = e.target.closest("[data-" + type + "]");
      if (!el || !root.contains(el)) return;
      const raw = el.getAttribute("data-" + type);
      const parts = raw.split("|");
      const name = parts.shift();
      const fn = H[name];
      if (fn) fn.apply(null, [e].concat(parts));
    };
  }

  root.addEventListener("click", dispatch("click"));
  root.addEventListener("input", dispatch("input"));
  root.addEventListener("change", dispatch("change"));
  root.addEventListener("keydown", dispatch("keydown"));
  root.addEventListener("mousedown", dispatch("mousedown"));

  root.addEventListener("dragover", function (e) {
    if (e.target.closest(".dropzone")) { e.preventDefault(); e.target.closest(".dropzone").classList.add("drag"); }
  });
  root.addEventListener("dragleave", function (e) {
    const dz = e.target.closest(".dropzone");
    if (dz) dz.classList.remove("drag");
  });
  root.addEventListener("drop", function (e) {
    const dz = e.target.closest(".dropzone");
    if (!dz) return;
    e.preventDefault();
    dz.classList.remove("drag");
    const f = e.dataTransfer.files && e.dataTransfer.files[0];
    if (f) store.setUploadFile(f);
  });

  // Checkboxes/toggles are plain buttons/spans, not native inputs — clicking
  // anywhere delegated above already covers them via data-click.

  // ── comment editor hydration ────────────────────────────────────────
  // Content is owned by the DOM once mounted (see dom.js), so we only ever
  // seed it from state the first time a given node appears.
  function hydrateEditors() {
    root.querySelectorAll("[contenteditable][data-meeting-id]").forEach((el) => {
      const id = el.getAttribute("data-meeting-id");
      if (el.__hydratedFor === id) return;
      const m = store.state.meetings.find((x) => x.id === id);
      el.innerHTML = m ? m.comments || "" : "";
      el.__hydratedFor = id;
    });
  }

  // ── theme ────────────────────────────────────────────────────────────
  function applyTheme() {
    const t = store.state.theme === "dark" ? "dark" : "light";
    if (document.documentElement.getAttribute("data-theme") !== t) {
      document.documentElement.setAttribute("data-theme", t);
      document.documentElement.style.colorScheme = t;
    }
  }

  // ── render loop ──────────────────────────────────────────────────────
  function render() {
    const html = Views.Root(store);
    DomMorph.morph(root, html);
    hydrateEditors();
    applyTheme();
  }

  store.onChange(render);
  render();
})();
