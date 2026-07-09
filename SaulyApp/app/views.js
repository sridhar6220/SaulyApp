// View-render functions: state + data in, HTML string out. No DOM access,
// no store mutation — everything interactive is expressed as
// data-click/data-input/... attributes dispatched by app.js.
(function (global) {
  "use strict";
  const D = global.Data;
  const esc = UI.esc;
  const act = UI.act;

  function isoDate(d) { return d ? d.toISOString().slice(0, 10) : ""; }

  // ── Sidebar ───────────────────────────────────────────────────────
  function Sidebar(s) {
    const collapsed = s.sidebarCollapsed;
    const dark = s.theme === "dark";
    return (
      '<aside class="sidebar' + (collapsed ? " collapsed" : "") + '">' +
      '<div class="sidebar-header">' +
      (collapsed
        ? '<img src="assets/sauly-mark.svg" alt="Sauly" style="height:28px;width:auto;">'
        : (dark
            ? '<img src="assets/sauly-wordmark-dark.svg" alt="Sauly" style="height:26px;width:auto;">'
            : '<img src="assets/sauly-wordmark-light.svg" alt="Sauly" style="height:26px;width:auto;">'))
      + "</div>" +
      '<div class="sidebar-nav">' +
      UI.NavItem({ icon: "home", label: "Dashboard", active: s.view === "dashboard", click: "goToDashboard", collapsed }) +
      UI.NavItem({ icon: "briefcase", label: "Meetings", active: s.view === "list", click: "goToMeetingsNav", collapsed }) +
      "</div>" +
      '<div class="sidebar-spacer"></div>' +
      '<div class="sidebar-collapse-row" style="justify-content:' + (collapsed ? "center" : "flex-end") + ';">' +
      UI.IconButton({ iconName: collapsed ? "chevronRight" : "chevronLeft", ariaLabel: "Toggle sidebar", hierarchy: "secondary", size: "sm", click: "toggleSidebar" }) +
      "</div>" +
      '<div class="sidebar-footer">' +
      UI.NavItem({ icon: "gear", label: "Settings", active: s.view === "settings", click: "goToSettings", collapsed }) +
      "</div>" +
      "</aside>"
    );
  }

  // ── Topbar ────────────────────────────────────────────────────────
  function Topbar(s) {
    return (
      '<div class="topbar">' +
      (s.view === "detail" ? UI.Breadcrumb([{ label: "Meetings", click: "backToList" }, { label: (s.meetings.find((m) => m.id === s.activeId) || {}).title || "" }]) : "") +
      '<div style="flex:1;"></div>' +
      UI.IconButton({ iconName: s.theme === "dark" ? "sun" : "moon", ariaLabel: "Toggle theme", hierarchy: "secondary", click: "toggleTheme" }) +
      "</div>"
    );
  }

  // ── Dashboard ─────────────────────────────────────────────────────
  function statusCard(s) {
    if (s.liveActive) {
      const elapsed = D.fmtDuration(s.liveElapsed).slice(3);
      return (
        '<div class="card status-card">' +
        '<div style="display:flex;align-items:center;gap:14px;">' +
        '<span class="live-dot"></span>' +
        '<div><div style="font-weight:600;font-size:15px;">Recording live — DevOps Engineer — Technical Screen</div>' +
        '<div style="font-size:13px;color:var(--text-tertiary);">Ridgeline Systems · Google Meet · ' + elapsed + " elapsed</div></div>" +
        "</div>" +
        UI.Button({ hierarchy: "secondary", destructive: true, click: "endLiveSession", label: "End session" }) +
        "</div>"
      );
    }
    return (
      '<div class="card status-card">' +
      '<div style="display:flex;align-items:center;gap:14px;">' +
      UI.FeaturedIcon({ icon: "briefcase" }) +
      '<div><div style="font-weight:600;font-size:15px;">No active recording</div>' +
      '<div style="font-size:13px;color:var(--text-tertiary);">Saul picks up calls automatically on Zoom, Teams and Google Meet.</div></div>' +
      "</div>" +
      '<div style="display:flex;align-items:center;gap:10px;">' +
      UI.Button({ hierarchy: "primary", click: "openUploadModal", iconLeft: "import", label: "Upload audio file" }) +
      UI.Button({ hierarchy: "secondary", click: "startLiveSession", label: "Simulate incoming call" }) +
      "</div>" +
      "</div>"
    );
  }

  function statCard(icon, label, value, caption) {
    return (
      '<div class="card stat-card">' +
      '<div class="row1"><span class="label">' + esc(label) + "</span>" +
      '<span class="icon-wrap">' + ICON(icon, 18) + "</span></div>" +
      '<div class="value">' + esc(value) + "</div>" +
      '<div class="caption">' + esc(caption) + "</div>" +
      "</div>"
    );
  }

  function DashboardView(s) {
    const totalCount = s.meetings.length;
    const openActionItems = s.meetings.reduce((acc, m) => acc + m.actionItems.filter((a) => !a.done).length, 0);
    const totalSeconds = s.meetings.reduce((acc, m) => acc + D.durationToSeconds(m.duration), 0);
    const avgSeconds = Math.round(totalSeconds / (s.meetings.length || 1));
    return (
      '<div class="page">' +
      '<div><h1 class="page-title">Dashboard</h1><p class="page-sub">Your job-search activity at a glance.</p></div>' +
      statusCard(s) +
      '<div class="stat-grid">' +
      statCard("briefcase", "Meetings logged", String(totalCount), "Since Jun 15") +
      statCard("clipboard", "Open action items", String(openActionItems), "Across all calls") +
      statCard("chartSquare", "Avg. call length", D.fmtDuration(avgSeconds), "Per meeting") +
      "</div>" +
      "</div>"
    );
  }

  // ── Meetings list ─────────────────────────────────────────────────
  function platformIconImg(platform, size) {
    const meta = D.PLATFORM_META[platform];
    size = size || 16;
    return '<img src="' + meta.icon + '" width="' + size + '" height="' + size + '" alt="" style="flex-shrink:0;display:block;">';
  }

  function highlightsList(store, highlights, ordered) {
    const tag = ordered ? "ol" : "ul";
    return (
      "<" + tag + ' class="highlights-list' + (ordered ? "" : " bullet") + '">' +
      highlights.map((h, i) => '<li data-key="hl-' + i + '">' + store.highlightMatch(h) + "</li>").join("") +
      "</" + tag + ">"
    );
  }

  function actionItemsBlock(store, meetingId, actionItems, newItemValue) {
    return (
      '<div style="display:flex;flex-direction:column;gap:10px;">' +
      actionItems
        .map((item) => {
          const ai = store.buildActionItem(meetingId, item);
          if (ai.isEditing) {
            return (
              '<div class="action-item" data-key="ai-' + item.id + '">' +
              UI.Checkbox({ checked: item.done, click: "toggleActionItem", args: [meetingId, item.id] }) +
              '<div class="action-item-edit-row">' +
              '<input class="text-input" style="flex:1;" value="' + esc(ai.editValue) + '" data-input="setEditDraft" data-keydown="editDraftKeydown" autofocus />' +
              UI.IconButton({ iconName: "check", ariaLabel: "Save", hierarchy: "primary", size: "sm", click: "saveEdit" }) +
              "</div></div>"
            );
          }
          return (
            '<div class="action-item" data-key="ai-' + item.id + '">' +
            UI.Checkbox({ checked: item.done, click: "toggleActionItem", args: [meetingId, item.id] }) +
            '<div class="txt' + (item.done ? " done" : "") + '"' + act("click", "startEdit", [meetingId, item.id]) + ">" + esc(item.text) + "</div>" +
            UI.IconButton({ iconName: "close", iconSize: 14, ariaLabel: "Remove", hierarchy: "tertiary", size: "sm", click: "removeActionItem", args: [meetingId, item.id] }) +
            "</div>"
          );
        })
        .join("") +
      '<div class="new-item-row">' +
      '<input placeholder="Add an action item…" value="' + esc(newItemValue) + '" data-input="setNewItemDraft" data-keydown="newItemKeydown|' + esc(meetingId) + '" />' +
      UI.IconButton({ iconName: "plus", ariaLabel: "Add", hierarchy: "secondary", size: "sm", click: "addActionItem", args: [meetingId] }) +
      "</div></div>"
    );
  }

  function commentsBlock(meeting, sizeClass) {
    return (
      '<div class="comments-block">' +
      '<div class="col-heading" style="margin-bottom:6px;">' + ICON("edit", 18) + '<span class="label">Comments</span></div>' +
      '<div class="fmt-toolbar">' +
      '<button type="button" class="fmt-btn b" aria-label="Bold" data-mousedown="preventFocusSteal" data-click="applyFormat|bold">B</button>' +
      '<button type="button" class="fmt-btn i" aria-label="Italic" data-mousedown="preventFocusSteal" data-click="applyFormat|italic">I</button>' +
      '<button type="button" class="fmt-btn" aria-label="Bulleted list" data-mousedown="preventFocusSteal" data-click="applyFormat|bullet">•</button>' +
      '<button type="button" class="fmt-btn" aria-label="Numbered list" data-mousedown="preventFocusSteal" data-click="applyFormat|numbered">1.</button>' +
      "</div>" +
      '<div class="comment-editor ' + (sizeClass || "") + '" data-meeting-id="' + esc(meeting.id) + '" role="textbox" aria-multiline="true" aria-label="Comments" contenteditable="true" data-input="commentsInput" data-placeholder="Notes you can add or remove anytime — just for your reference."></div>' +
      "</div>"
    );
  }

  function colHeading(icon, label, size) {
    return '<div class="col-heading">' + ICON(icon, size || 20) + '<span class="label">' + esc(label) + "</span></div>";
  }

  function MeetingRow(store, m) {
    const s = store.state;
    const meta = D.PLATFORM_META[m.platform];
    const isExpanded = s.expandedId === m.id;
    return (
      '<div class="mtg-row" data-key="row-' + m.id + '">' +
      '<div class="mtg-row-main" role="button" tabindex="0" aria-expanded="' + (isExpanded ? "true" : "false") +
      '"' + act("click", "toggleExpand", [m.id]) + act("keydown", "toggleExpandKey", [m.id]) + ">" +
      '<div style="min-width:0;">' +
      '<div class="mtg-title">' + store.highlightMatch(m.title) + "</div>" +
      '<div class="mtg-company">' + store.highlightMatch(m.company) + "</div>" +
      "</div>" +
      '<span class="mtg-cell">' + esc(m.date) + "</span>" +
      '<span class="mtg-duration">' + esc(m.duration) + "</span>" +
      '<div class="mtg-platform">' + platformIconImg(m.platform) + '<span class="mtg-cell">' + esc(meta.label) + "</span></div>" +
      '<div class="mtg-interviewer"><div style="min-width:0;">' +
      '<div class="name">' + store.highlightMatch(m.interviewer.name) + "</div>" +
      '<div class="email">' + esc(m.interviewer.email) + "</div></div></div>" +
      UI.IconButton({ iconName: isExpanded ? "chevronUp" : "chevronDown", ariaLabel: "Toggle details", hierarchy: "tertiary", size: "sm", click: "toggleExpandStop", args: [m.id] }) +
      "</div>" +
      (isExpanded
        ? '<div class="mtg-expanded">' +
          '<div class="view-details-row">' +
          UI.Button({ hierarchy: "secondary", size: "sm", click: "openDetailModal", args: [m.id], iconLeft: "fourArrows", label: "View details" }) +
          "</div>" +
          '<div class="mtg-expanded-cols">' +
          "<div>" + colHeading("bookmark", "Key highlights", 22) + highlightsList(store, m.highlights, true) + "</div>" +
          "<div>" + colHeading("clipboard", "Action items", 22) + actionItemsBlock(store, m.id, m.actionItems, s.expandedId === m.id ? s.newItemDraft : "") + "</div>" +
          "<div>" + commentsBlock(m, "") + "</div>" +
          "</div>" +
          "</div>"
        : "") +
      "</div>"
    );
  }

  function sortHeaderBtn(label, sortKey, s) {
    const icon = s.sortKey === sortKey ? (s.sortDir === "desc" ? " ↓" : " ↑") : "";
    return '<button type="button"' + act("click", "setSort", [sortKey]) + ">" + esc(label) + icon + "</button>";
  }

  function dateRangeLabel(s) {
    return s.dateFrom || s.dateTo ? D.fmtShortDate(s.dateFrom) + " – " + D.fmtShortDate(s.dateTo) : "Date range";
  }

  function DateRangeControl(s) {
    const open = s.isDateModalOpen;
    return (
      '<div style="position:relative;">' +
      UI.Button({ hierarchy: "secondary", click: "toggleDateCard", iconLeft: "calendar", label: esc(dateRangeLabel(s)) }) +
      (open
        ? '<div class="date-popover-mask" data-click="closeDateModal"></div>' +
          '<div class="date-popover">' +
          '<div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:16px;">' +
          '<div class="date-field"><label>From</label><input type="date"' + attrVal(isoDate(s.dateFrom)) + ' data-change="dateFromChange"></div>' +
          '<div class="date-field"><label>To</label><input type="date"' + attrVal(isoDate(s.dateTo)) + ' data-change="dateToChange"></div>' +
          "</div>" +
          '<div style="display:flex;justify-content:space-between;gap:12px;">' +
          UI.Button({ hierarchy: "tertiary", click: "clearDateRange", label: "Clear" }) +
          UI.Button({ hierarchy: "primary", click: "closeDateModal", label: "Done" }) +
          "</div></div>"
        : "") +
      "</div>"
    );
  }
  function attrVal(v) { return v ? ' value="' + esc(v) + '"' : ""; }

  function MeetingsListView(store) {
    const s = store.state;
    const rows = store.filteredSortedRows();
    return (
      '<div class="page">' +
      '<div style="display:flex;align-items:flex-end;justify-content:space-between;gap:16px;">' +
      '<div><h1 class="page-title">Meetings history</h1><p class="page-sub">Every call’s highlights and action items, captured automatically.</p></div>' +
      UI.Button({ hierarchy: "primary", click: "openUploadModal", iconLeft: "plus", label: "Add meeting" }) +
      "</div>" +
      '<div class="toolbar">' +
      '<div class="search-input-wrap">' + ICON("search", 16) +
      '<input class="search-input" placeholder="Search meetings, companies, interviewers…" value="' + esc(s.query) + '" data-input="setQuery" /></div>' +
      UI.SegmentedControl({
        options: [{ value: "all", label: "All platforms" }, { value: "zoom", label: "Zoom" }, { value: "teams", label: "Teams" }, { value: "meet", label: "Google Meet" }],
        value: s.platformFilter, onChange: "setPlatformFilter",
      }) +
      '<div style="flex:1;"></div>' +
      DateRangeControl(s) +
      "</div>" +
      '<div style="display:flex;justify-content:flex-end;margin-top:-14px;"><span style="font-size:13px;color:var(--text-tertiary);">Showing ' + rows.length + " of " + s.meetings.length + " meetings</span></div>" +
      (rows.length > 0
        ? '<div class="mtg-table">' +
          '<div class="mtg-head">' +
          sortHeaderBtn("Meeting", "title", s) + sortHeaderBtn("Date", "date", s) + sortHeaderBtn("Duration", "duration", s) +
          sortHeaderBtn("Platform", "platform", s) + sortHeaderBtn("Interviewer", "interviewer", s) + "<span></span>" +
          "</div>" +
          rows.map((m) => MeetingRow(store, m)).join("") +
          "</div>" +
          '<div style="display:flex;justify-content:flex-end;">' + UI.Pagination() + "</div>"
        : UI.EmptyState({ icon: "briefcase", title: "No meetings match", description: "Try a different search term or clear the platform filter." })) +
      "</div>"
    );
  }

  // ── Detail modal (shared by list "View details" and upload flow) ──
  function DetailModalBody(store, m) {
    const s = store.state;
    const meta = D.PLATFORM_META[m.platform];
    const doneCount = m.actionItems.filter((a) => a.done).length;
    const copied = s.copiedKey === m.id;
    return (
      '<div style="display:flex;flex-direction:column;gap:18px;height:520px;overflow-y:auto;padding-bottom:8px;padding-right:4px;">' +
      '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">' +
      '<span style="font-size:13px;color:var(--text-tertiary);white-space:nowrap;">' + esc(m.date) + " at " + esc(m.time) + "</span>" +
      '<span style="color:var(--border-strong);">•</span>' +
      '<span style="font-family:var(--font-mono);font-size:12.5px;color:var(--text-tertiary);white-space:nowrap;">' + esc(m.duration) + "</span>" +
      '<div style="display:flex;align-items:center;gap:6px;">' + platformIconImg(m.platform) + '<span class="mtg-cell">' + esc(meta.label) + "</span></div>" +
      '<div style="flex:1;min-width:12px;"></div>' +
      UI.Button({ hierarchy: "secondary", size: "sm", click: "copySummary", args: [m.id], label: copied ? "Copied!" : "Copy summary" }) +
      "</div>" +
      UI.Tabs({ tabs: [{ value: "overview", label: "Overview" }, { value: "transcript", label: "Transcript" }], value: s.detailTab, onChange: "setDetailTab" }) +
      (s.detailTab === "overview"
        ? '<div>' + colHeading("bookmark", "Key highlights", 22) + highlightsList(store, m.highlights, true) + "</div>"
        : m.transcript.length
        ? '<div style="display:flex;flex-direction:column;gap:14px;">' +
          m.transcript.map((t, i) =>
            '<div style="display:flex;gap:14px;" data-key="tl-' + i + '">' +
            '<span style="font-family:var(--font-mono);font-size:12px;color:var(--text-placeholder);width:44px;flex-shrink:0;padding-top:2px;">' + esc(t.time) + "</span>" +
            '<div><div style="font-size:12.5px;font-weight:600;color:var(--text-tertiary);margin-bottom:2px;">' + esc(t.speaker) + "</div>" +
            '<div style="font-size:13.5px;line-height:20px;color:var(--text-secondary);">' + esc(t.text) + "</div></div></div>"
          ).join("") +
          "</div>"
        : UI.EmptyState({ icon: "clipboard", title: "No transcript captured", description: "This call wasn't recorded, so only the summary is available." })) +
      "<div>" +
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">' +
      colHeading("clipboard", "Action items", 22) +
      '<span style="font-size:12px;color:var(--text-tertiary);">' + doneCount + "/" + m.actionItems.length + " done</span></div>" +
      actionItemsBlock(store, m.id, m.actionItems, s.newItemDraft) +
      "</div>" +
      commentsBlock(m, "modal-size") +
      "</div>"
    );
  }

  function DetailModal(store) {
    const s = store.state;
    if (!s.isDetailModalOpen) return "";
    const m = s.meetings.find((x) => x.id === s.detailModalId);
    if (!m) return "";
    return UI.Modal({ open: true, id: "detail", title: m.title, description: m.company, width: 720, bodyHtml: DetailModalBody(store, m) });
  }

  // ── Upload modal ───────────────────────────────────────────────────
  function UploadModal(store) {
    const s = store.state;
    if (!s.uploadModalOpen) return "";
    const platformOpts = [{ value: "zoom", label: "Zoom" }, { value: "teams", label: "Microsoft Teams" }, { value: "meet", label: "Google Meet" }];
    const cannotSubmit = !s.uploadFileName || s.uploadStatus === "processing";
    const body =
      '<div style="display:flex;flex-direction:column;gap:16px;">' +
      UI.Dropzone({ fileName: s.uploadFileName }) +
      '<div class="form-field"><label>Meeting title</label>' +
      '<input type="text" value="' + esc(s.uploadTitle) + '" placeholder="e.g. Frontend Engineer — Screen" data-input="uploadTitleInput" /></div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">' +
      '<div class="form-field"><label>Company</label><input type="text" value="' + esc(s.uploadCompany) + '" placeholder="Optional" data-input="uploadCompanyInput" /></div>' +
      '<div class="form-field"><label>Platform</label>' + UI.Select({ fieldKey: "uploadPlatform", options: platformOpts, value: s.uploadPlatform, open: s.openSelect === "uploadPlatform", onChange: "chooseUploadPlatform" }) + "</div>" +
      "</div>" +
      '<div style="display:flex;align-items:center;justify-content:flex-end;gap:10px;margin-top:6px;">' +
      UI.Button({ hierarchy: "secondary", click: "closeUploadModal", label: "Cancel" }) +
      UI.Button({ hierarchy: "primary", disabled: cannotSubmit, click: "submitUpload", label: s.uploadStatus === "processing" ? "Transcribing…" : "Transcribe & add" }) +
      "</div>" +
      (s.uploadStatus === "processing" ? '<div style="font-size:12.5px;color:var(--text-tertiary);text-align:right;margin-top:-6px;">Transcribing audio and generating summary…</div>' : "") +
      "</div>";
    return UI.Modal({ open: true, id: "upload", icon: "import", title: "Upload audio file", description: "Import a recording to transcribe and summarize.", width: 480, bodyHtml: body });
  }

  // ── Settings ─────────────────────────────────────────────────────
  const SETTINGS_NAV = [
    { id: "general", label: "General", icon: "gearHex" },
    { id: "recording", label: "Recording", icon: "mic" },
    { id: "transcription", label: "Transcription", icon: "document" },
    { id: "summary", label: "Summary", icon: "note" },
    { id: "connectors", label: "Connectors", icon: "plug" },
    { id: "beta", label: "Beta", icon: "flask" },
  ];

  function settingsRow(title, desc, controlHtml) {
    return '<div class="settings-row"><div><div class="row-title">' + esc(title) + '</div>' + (desc ? '<div class="row-desc">' + esc(desc) + "</div>" : "") + "</div>" + controlHtml + "</div>";
  }

  function GeneralSection(s) {
    return (
      '<div class="card settings-card"><div class="settings-card-title">Appearance</div>' +
      settingsRow("Theme", "Switch between light and dark.", UI.SegmentedControl({ options: [{ value: "light", label: "Light" }, { value: "dark", label: "Dark" }], value: s.theme, onChange: "setTheme" })) +
      "</div>" +
      '<div class="card settings-card"><div class="settings-card-title">Data &amp; privacy</div>' +
      '<div class="settings-row" style="display:block;">' +
      '<div class="row-title">Data storage location</div><div class="row-desc" style="margin-bottom:10px;">Where recordings and transcripts are saved on this device.</div>' +
      '<div class="storage-row"><input value="' + esc(s.settings.dataStorage) + '" spellcheck="false" data-input="settingsInput|dataStorage" />' +
      UI.Button({ hierarchy: "secondary", label: "Browse…" }) + "</div></div>" +
      settingsRow("Usage analytics", "Share anonymous usage data to help improve Sauly.", UI.Toggle({ checked: s.settings.usageAnalytics, click: "toggleSetting", args: ["usageAnalytics"] })) +
      "</div>"
    );
  }

  function RecordingSection(s) {
    return (
      '<div class="card settings-card"><div class="settings-card-title">Capture</div>' +
      settingsRow("Save recorded audio files", "Keep the raw audio after transcription completes.", UI.Toggle({ checked: s.settings.saveAudioFiles, click: "toggleSetting", args: ["saveAudioFiles"] })) +
      settingsRow("Recording format", "Container and codec for saved audio.", UI.Select({ fieldKey: "recordingFormat", options: D.RECORDING_FORMATS, value: s.settings.recordingFormat, open: s.openSelect === "recordingFormat", onChange: "selectSetting" })) +
      settingsRow("Recording start notification", "Show a system notification when capture begins.", UI.Toggle({ checked: s.settings.recordingStartNotification, click: "toggleSetting", args: ["recordingStartNotification"] })) +
      "</div>" +
      '<div class="card settings-card"><div class="settings-card-title">Meeting auto-detect</div>' +
      settingsRow("Auto-detect meetings", "Start recording automatically when a call is detected.", UI.Toggle({ checked: s.settings.meetingAutoDetect, click: "toggleSetting", args: ["meetingAutoDetect"] })) +
      '<div class="settings-row" style="display:block;">' +
      '<div class="row-title">Detect on these platforms</div><div class="row-desc" style="margin-bottom:12px;">Which apps Sauly watches for an active meeting.</div>' +
      '<div class="checkbox-group">' +
      UI.Checkbox({ checked: s.settings.autoDetectZoom, click: "toggleSetting", args: ["autoDetectZoom"], label: "Zoom" }) +
      UI.Checkbox({ checked: s.settings.autoDetectTeams, click: "toggleSetting", args: ["autoDetectTeams"], label: "Microsoft Teams" }) +
      UI.Checkbox({ checked: s.settings.autoDetectMeet, click: "toggleSetting", args: ["autoDetectMeet"], label: "Google Meet" }) +
      "</div></div></div>" +
      '<div class="card settings-card"><div class="settings-card-title">Audio devices</div>' +
      settingsRow("Microphone", "", UI.Select({ fieldKey: "micDevice", options: D.MIC_DEVICES, value: s.settings.micDevice, open: s.openSelect === "micDevice", onChange: "selectSetting" })) +
      settingsRow("System audio", "", UI.Select({ fieldKey: "systemAudioDevice", options: D.SYSTEM_AUDIO_DEVICES, value: s.settings.systemAudioDevice, open: s.openSelect === "systemAudioDevice", onChange: "selectSetting" })) +
      settingsRow("System audio backend", "", UI.Select({ fieldKey: "systemAudioBackend", options: D.SYSTEM_AUDIO_BACKENDS, value: s.settings.systemAudioBackend, open: s.openSelect === "systemAudioBackend", onChange: "selectSetting" })) +
      "</div>"
    );
  }

  function TranscriptionSection(s) {
    const variants = (D.TRANSCRIPTION_MODELS.find((m) => m.value === s.settings.transcriptionModel) || D.TRANSCRIPTION_MODELS[0]).variants;
    return (
      '<div class="card settings-card">' +
      '<div class="settings-card-title">Transcription model</div><p class="settings-card-desc">Runs on-device. Larger variants are more accurate but slower.</p>' +
      settingsRow("Model", "", UI.Select({ fieldKey: "transcriptionModel", options: D.TRANSCRIPTION_MODELS, value: s.settings.transcriptionModel, open: s.openSelect === "transcriptionModel", onChange: "chooseTranscriptionModel" })) +
      settingsRow("Variant", "", UI.Select({ fieldKey: "transcriptionVariant", options: variants, value: s.settings.transcriptionVariant, open: s.openSelect === "transcriptionVariant", onChange: "selectSetting" })) +
      "</div>"
    );
  }

  function SummarySection(s) {
    const variants = (D.SUMMARY_MODELS.find((m) => m.value === s.settings.summaryModel) || D.SUMMARY_MODELS[0]).variants;
    const isLocal = (D.SUMMARY_MODELS.find((m) => m.value === s.settings.summaryModel) || {}).local === true;
    return (
      '<div class="card settings-card"><div class="settings-card-title">Summaries</div>' +
      settingsRow("Auto summary", "Generate a summary automatically when a meeting ends.", UI.Toggle({ checked: s.settings.autoSummary, click: "toggleSetting", args: ["autoSummary"] })) +
      "</div>" +
      '<div class="card settings-card">' +
      '<div class="settings-card-title">Summary language</div>' +
      '<p class="settings-card-desc">Pin one language as the default for new meetings. Unpinned languages stay as quick-switch options in the summary generator.</p>' +
      '<div style="margin-top:6px;">' +
      D.SUMMARY_LANGUAGES.map((l) => {
        const isDefault = s.settings.summaryDefaultLang === l.value;
        return (
          '<div class="lang-row" data-key="lang-' + l.value + '"><span style="font-size:14px;">' + esc(l.label) + "</span>" +
          '<button type="button" class="pin-btn' + (isDefault ? " default" : "") + '"' + act("click", "pinSummaryLang", [l.value]) + ">" + (isDefault ? "Default" : "Set default") + "</button></div>"
        );
      }).join("") +
      "</div></div>" +
      '<div class="card settings-card"><div class="settings-card-title">Summary model</div>' +
      settingsRow("Model", "", UI.Select({ fieldKey: "summaryModel", options: D.SUMMARY_MODELS, value: s.settings.summaryModel, open: s.openSelect === "summaryModel", onChange: "chooseSummaryModel" })) +
      '<div class="settings-row"><div class="row-title">Variant</div><div style="display:flex;align-items:center;gap:10px;">' +
      UI.Select({ fieldKey: "summaryVariant", options: variants, value: s.settings.summaryVariant, open: s.openSelect === "summaryVariant", onChange: "selectSetting", style: "min-width:200px;" }) +
      (isLocal ? UI.Button({ hierarchy: "secondary", iconLeft: "import", label: "Download" }) : "") +
      "</div></div></div>"
    );
  }

  function ConnectorsSection(s) {
    const items = [
      { id: "google", name: "Google Calendar", icon: "assets/gmeet.svg" },
      { id: "zoom", name: "Zoom Calendar", icon: "assets/Zoom.svg" },
      { id: "outlook", name: "Outlook Calendar", icon: "assets/teams.svg" },
    ];
    return (
      '<div class="card settings-card">' +
      '<div class="settings-card-title">Connectors</div><p class="settings-card-desc">Link a calendar so Sauly knows which meetings to join automatically.</p>' +
      items.map((c) => {
        const connected = s.connectors[c.id];
        return (
          '<div class="settings-conn-row" data-key="conn-' + c.id + '">' +
          '<span class="conn-icon"><img src="' + c.icon + '" width="22" height="22" alt="" style="display:block;"></span>' +
          '<div style="flex:1;min-width:0;"><div style="font-weight:600;font-size:14px;">' + esc(c.name) + "</div>" +
          '<div style="font-size:12.5px;color:var(--text-tertiary);">' + (connected ? "Connected — syncing meetings" : "Not connected") + "</div></div>" +
          UI.Button({ hierarchy: connected ? "secondary" : "primary", destructive: connected, click: "toggleConnector", args: [c.id], label: connected ? "Disconnect" : "Connect" }) +
          "</div>"
        );
      }).join("") +
      "</div>"
    );
  }

  function BetaSection(s) {
    const feats = [
      { id: "betaLiveSuggestions", name: "Live answer suggestions", desc: "Surface talking points in real time during a call. Rough around the edges." },
      { id: "betaLocalDiarization", name: "On-device speaker diarization", desc: "Label who said what locally, without sending audio to the cloud." },
      { id: "betaSmartClips", name: "Smart clips", desc: "Auto-cut short highlight clips from each recording." },
    ];
    return (
      '<div class="card settings-card">' +
      '<div style="display:flex;align-items:center;gap:8px;">' +
      '<span class="settings-card-title">Experimental features</span>' + UI.Badge({ color: "violet", label: "Beta" }) + "</div>" +
      '<p class="settings-card-desc">These are early and may change or break. Enable at your own risk.</p>' +
      feats.map((f) => '<div data-key="beta-' + f.id + '">' + settingsRow(f.name, f.desc, UI.Toggle({ checked: s.settings[f.id], click: "toggleSetting", args: [f.id] })) + "</div>").join("") +
      "</div>"
    );
  }

  function SettingsView(s) {
    const sectionMap = { general: GeneralSection, recording: RecordingSection, transcription: TranscriptionSection, summary: SummarySection, connectors: ConnectorsSection, beta: BetaSection };
    return (
      '<div class="page" style="padding-bottom:48px;max-width:980px;">' +
      '<div><h1 class="page-title">Settings</h1><p class="page-sub">Configure recording, transcription, summaries and connected calendars.</p></div>' +
      '<div class="settings-grid">' +
      '<nav class="settings-nav">' +
      SETTINGS_NAV.map((n) => '<button type="button" class="settings-nav-btn' + (s.settingsSection === n.id ? " active" : "") + '" data-key="snav-' + n.id + '"' + act("click", "setSettingsSection", [n.id]) + ">" + ICON(n.icon, 18) + esc(n.label) + "</button>").join("") +
      "</nav>" +
      '<div class="settings-section">' + sectionMap[s.settingsSection](s) + "</div>" +
      "</div></div>"
    );
  }

  // ── Root ────────────────────────────────────────────────────────
  function Root(store) {
    const s = store.state;
    let content = "";
    if (s.view === "dashboard") content = DashboardView(s);
    else if (s.view === "settings") content = SettingsView(s);
    else content = MeetingsListView(store);
    return (
      Sidebar(s) +
      '<div style="flex:1;min-width:0;display:flex;flex-direction:column;">' +
      Topbar(s) +
      content +
      "</div>" +
      DetailModal(store) +
      UploadModal(store)
    );
  }

  global.Views = { Root };
})(window);
