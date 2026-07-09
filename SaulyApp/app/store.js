// App state + actions, ported from the design prototype's Component class.
// Pure state management — no DOM here. app.js subscribes via store.onChange.
(function (global) {
  "use strict";
  const D = global.Data;

  class Store {
    constructor() {
      this.state = {
        view: "list",
        activeId: null,
        query: "",
        platformFilter: "all",
        dateFrom: null,
        dateTo: null,
        expandedId: null,
        detailTab: "overview",
        editKey: null,
        editDraft: "",
        newItemDraft: "",
        copiedKey: null,
        liveActive: false,
        liveElapsed: 0,
        meetings: D.seedMeetings(),
        sidebarCollapsed: false,
        isDateModalOpen: false,
        isDetailModalOpen: false,
        detailModalId: null,
        uploadModalOpen: false,
        uploadFileName: null,
        uploadTitle: "",
        uploadCompany: "",
        uploadPlatform: "zoom",
        uploadStatus: "idle",
        theme: "light",
        sortKey: null,
        sortDir: "asc",
        connectors: { google: false, zoom: false, outlook: false },
        settingsSection: "general",
        openSelect: null,
        settings: {
          dataStorage: "~/Library/Application Support/Sauly/recordings",
          usageAnalytics: true,
          saveAudioFiles: true,
          recordingFormat: "wav",
          recordingStartNotification: true,
          autoDetectZoom: true,
          autoDetectTeams: true,
          autoDetectMeet: false,
          micDevice: "macbook-mic",
          systemAudioDevice: "loopback",
          systemAudioBackend: "screencapturekit",
          meetingAutoDetect: true,
          transcriptionModel: "whisper",
          transcriptionVariant: "large-v3",
          autoSummary: true,
          summaryDefaultLang: "auto",
          summaryModel: "claude",
          summaryVariant: "sonnet",
          betaLocalDiarization: false,
          betaLiveSuggestions: false,
          betaSmartClips: false,
        },
      };
      this._onChange = null;
    }

    onChange(fn) { this._onChange = fn; }

    setState(patch) {
      if (typeof patch === "function") patch = patch(this.state);
      Object.assign(this.state, patch);
      if (this._onChange) this._onChange();
    }

    // ── navigation ──────────────────────────────────────────────────
    goToDashboard() { this.setState({ view: "dashboard" }); }
    goToMeetingsNav() { this.setState({ view: "list" }); }
    goToSettings() { this.setState({ view: "settings" }); }
    backToList() { this.setState({ view: "list" }); }
    openDetail(id) { this.setState({ view: "detail", activeId: id, detailTab: "overview", newItemDraft: "", editKey: null }); }
    setDetailTab(tab) { this.setState({ detailTab: tab }); }

    toggleSidebar() { this.setState((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })); }

    // ── theme ───────────────────────────────────────────────────────
    toggleTheme() { this.setState((s) => ({ theme: s.theme === "dark" ? "light" : "dark" })); }
    setTheme(theme) { this.setState({ theme }); }

    // ── sort / filter / search ─────────────────────────────────────
    setSort(key) {
      this.setState((s) => (s.sortKey === key ? { sortDir: s.sortDir === "asc" ? "desc" : "asc" } : { sortKey: key, sortDir: "asc" }));
    }
    setQuery(v) { this.setState({ query: v }); }
    setPlatformFilter(p) { this.setState({ platformFilter: p }); }
    setDateFrom(v) { this.setState({ dateFrom: v ? new Date(v) : null }); }
    setDateTo(v) { this.setState({ dateTo: v ? new Date(v) : null }); }
    toggleDateCard() { this.setState((s) => ({ isDateModalOpen: !s.isDateModalOpen, openSelect: null })); }
    closeDateModal() { this.setState({ isDateModalOpen: false }); }
    clearDateRange() { this.setState({ dateFrom: null, dateTo: null }); }

    // ── selects (generic dropdown open/close) ──────────────────────
    toggleSelect(key) { this.setState((s) => ({ openSelect: s.openSelect === key ? null : key, isDateModalOpen: false })); }
    closeSelect() { this.setState({ openSelect: null }); }

    // ── row expand / detail modal ──────────────────────────────────
    toggleExpand(id) {
      this.setState((s) => ({ expandedId: s.expandedId === id ? null : id, newItemDraft: "", editKey: null }));
    }
    openDetailModal(id) { this.setState({ detailModalId: id, isDetailModalOpen: true, detailTab: "overview" }); }
    closeDetailModal() { this.setState({ isDetailModalOpen: false, detailModalId: null }); }

    // ── live session (dashboard) ────────────────────────────────────
    startLiveSession() {
      clearInterval(this._liveTimer);
      this.setState({ liveActive: true, liveElapsed: 0 });
      this._liveTimer = setInterval(() => this.setState((s) => ({ liveElapsed: s.liveElapsed + 1 })), 1000);
    }
    endLiveSession() {
      clearInterval(this._liveTimer);
      this.setState({ liveActive: false, liveElapsed: 0 });
    }

    // ── upload flow ──────────────────────────────────────────────────
    openUploadModal() {
      this.setState({ uploadModalOpen: true, uploadFileName: null, uploadTitle: "", uploadCompany: "", uploadPlatform: "zoom", uploadStatus: "idle" });
    }
    closeUploadModal() {
      if (this.state.uploadStatus === "processing") return;
      this.setState({ uploadModalOpen: false });
    }
    setUploadFile(file) {
      const name = file && (file.name || String(file));
      const guess = name ? name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim() : "";
      this.setState((s) => ({ uploadFileName: name, uploadTitle: s.uploadTitle || guess }));
    }
    clearUploadFile() { this.setState({ uploadFileName: null }); }
    setUploadTitle(v) { this.setState({ uploadTitle: v }); }
    setUploadCompany(v) { this.setState({ uploadCompany: v }); }
    setUploadPlatform(v) { this.setState({ uploadPlatform: v, openSelect: null }); }
    submitUpload() {
      if (!this.state.uploadFileName || this.state.uploadStatus === "processing") return;
      this.setState({ uploadStatus: "processing" });
      clearTimeout(this._uploadTimer);
      this._uploadTimer = setTimeout(() => {
        const now = new Date();
        const id = "up" + now.getTime();
        const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const meeting = {
          id,
          title: this.state.uploadTitle.trim() || "Uploaded recording",
          company: this.state.uploadCompany.trim() || "Imported audio",
          date: MON[now.getMonth()] + " " + now.getDate() + ", " + now.getFullYear(),
          dateISO: now.toISOString().slice(0, 10),
          time: now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
          duration: "00:00:00",
          platform: this.state.uploadPlatform,
          interviewer: { name: "Uploaded file", email: this.state.uploadFileName },
          highlights: ["Summary generated from the uploaded audio file.", "Review and edit these highlights as needed."],
          actionItems: [{ id: id + "-a0", text: "Review the auto-generated summary", done: false }],
          comments: "",
          transcript: [{ speaker: "Speaker 1", time: "00:03", text: "Transcript generated from " + this.state.uploadFileName + "." }],
          uploaded: true,
        };
        this.setState((s) => ({ meetings: [meeting, ...s.meetings], uploadModalOpen: false, uploadStatus: "done", view: "list" }));
        this.openDetailModal(id);
      }, 1600);
    }

    toggleConnector(key) { this.setState((s) => ({ connectors: { ...s.connectors, [key]: !s.connectors[key] } })); }

    // ── action items ─────────────────────────────────────────────────
    toggleActionItem(meetingId, itemId) {
      this.setState((s) => ({
        meetings: s.meetings.map((m) => (m.id !== meetingId ? m : { ...m, actionItems: m.actionItems.map((a) => (a.id === itemId ? { ...a, done: !a.done } : a)) })),
      }));
    }
    startEdit(meetingId, itemId) {
      const m = this.state.meetings.find((x) => x.id === meetingId);
      const item = m && m.actionItems.find((a) => a.id === itemId);
      this.setState({ editKey: meetingId + ":" + itemId, editDraft: item ? item.text : "" });
    }
    setEditDraft(v) { this.setState({ editDraft: v }); }
    cancelEdit() { this.setState({ editKey: null, editDraft: "" }); }
    saveEdit() {
      const key = this.state.editKey;
      if (!key) return;
      const idx = key.indexOf(":");
      const meetingId = key.slice(0, idx);
      const itemId = key.slice(idx + 1);
      const text = this.state.editDraft.trim();
      this.setState((s) => ({
        editKey: null, editDraft: "",
        meetings: s.meetings.map((m) => (m.id !== meetingId ? m : { ...m, actionItems: m.actionItems.map((a) => (a.id === itemId && text ? { ...a, text } : a)) })),
      }));
    }
    setNewItemDraft(v) { this.setState({ newItemDraft: v }); }
    addActionItem(meetingId) {
      const text = this.state.newItemDraft.trim();
      if (!text) return;
      this.setState((s) => ({
        newItemDraft: "",
        meetings: s.meetings.map((m) => (m.id !== meetingId ? m : { ...m, actionItems: [...m.actionItems, { id: meetingId + "-a" + Date.now(), text, done: false }] })),
      }));
    }
    removeActionItem(meetingId, itemId) {
      this.setState((s) => ({
        meetings: s.meetings.map((m) => (m.id !== meetingId ? m : { ...m, actionItems: m.actionItems.filter((a) => a.id !== itemId) })),
      }));
    }

    // ── comments ────────────────────────────────────────────────────
    setComments(meetingId, html) {
      this.setState((s) => ({ meetings: s.meetings.map((m) => (m.id === meetingId ? { ...m, comments: html } : m)) }));
    }

    copySummary(meeting) {
      const lines = [];
      lines.push(meeting.title + " — " + meeting.company);
      lines.push("");
      lines.push("Key highlights:");
      meeting.highlights.forEach((h, i) => lines.push(i + 1 + ". " + h));
      lines.push("");
      lines.push("Action items:");
      meeting.actionItems.forEach((a) => lines.push("- [" + (a.done ? "x" : " ") + "] " + a.text));
      const text = lines.join("\n");
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).catch(() => {});
      this.setState({ copiedKey: meeting.id });
      clearTimeout(this._copyTimer);
      this._copyTimer = setTimeout(() => this.setState({ copiedKey: null }), 1800);
    }

    // ── settings ────────────────────────────────────────────────────
    setSettingsSection(id) { this.setState({ settingsSection: id, openSelect: null }); }
    updateSetting(key, value) { this.setState((s) => ({ settings: { ...s.settings, [key]: value } })); }
    setTranscriptionModel(v) {
      const variant = (D.TRANSCRIPTION_MODELS.find((m) => m.value === v) || D.TRANSCRIPTION_MODELS[0]).variants[0].value;
      this.setState((s) => ({ settings: { ...s.settings, transcriptionModel: v, transcriptionVariant: variant }, openSelect: null }));
    }
    setSummaryModel(v) {
      const variant = (D.SUMMARY_MODELS.find((m) => m.value === v) || D.SUMMARY_MODELS[0]).variants[0].value;
      this.setState((s) => ({ settings: { ...s.settings, summaryModel: v, summaryVariant: variant }, openSelect: null }));
    }
    pinSummaryLang(v) { this.updateSetting("summaryDefaultLang", v); }
    selectSetting(key, value) { this.updateSetting(key, value); this.setState({ openSelect: null }); }

    // ── derived view-models ─────────────────────────────────────────
    highlightMatch(text) {
      const q = (this.state.query || "").trim();
      const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
      const escaped = esc(text);
      if (!q) return escaped;
      const rxEsc = esc(q).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      return escaped.replace(new RegExp("(" + rxEsc + ")", "gi"), "<mark>$1</mark>");
    }

    buildActionItem(meetingId, item) {
      const key = meetingId + ":" + item.id;
      const isEditing = this.state.editKey === key;
      return {
        id: item.id, text: item.text, done: item.done, isEditing,
        editValue: isEditing ? this.state.editDraft : "",
      };
    }

    filteredSortedRows() {
      const q = this.state.query.trim().toLowerCase();
      const platformFilter = this.state.platformFilter;
      let list = this.state.meetings.filter((m) => {
        if (platformFilter !== "all" && m.platform !== platformFilter) return false;
        if (q) {
          const hay = (
            m.title + " " + m.company + " " + m.interviewer.name + " " +
            (m.highlights || []).join(" ") + " " + (m.actionItems || []).map((a) => a.text).join(" ") + " " +
            (m.transcript || []).map((t) => t.speaker + " " + t.text).join(" ") + " " + (m.comments || "")
          ).toLowerCase();
          if (!hay.includes(q)) return false;
        }
        const d = new Date(m.dateISO);
        if (this.state.dateFrom && d < this.state.dateFrom) return false;
        if (this.state.dateTo && d > this.state.dateTo) return false;
        return true;
      });
      const sortKey = this.state.sortKey;
      if (sortKey) {
        const dir = this.state.sortDir === "desc" ? -1 : 1;
        const getSortVal = (m) => {
          switch (sortKey) {
            case "title": return m.title.toLowerCase();
            case "date": return new Date(m.dateISO).getTime();
            case "duration": return D.durationToSeconds(m.duration);
            case "platform": return D.PLATFORM_META[m.platform].label.toLowerCase();
            case "interviewer": return m.interviewer.name.toLowerCase();
            default: return "";
          }
        };
        list = [...list].sort((a, b) => {
          const av = getSortVal(a), bv = getSortVal(b);
          if (av < bv) return -1 * dir;
          if (av > bv) return 1 * dir;
          return 0;
        });
      }
      return list;
    }
  }

  global.Store = Store;
})(window);
