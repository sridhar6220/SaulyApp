// Seed data + option lists, ported from the design prototype's mock dataset.
(function (global) {
  "use strict";

  function fmtDuration(sec) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return "00:" + String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
  }
  function fmtShortDate(d) {
    if (!d) return "Any";
    const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return MON[d.getMonth()] + " " + d.getDate() + ", " + d.getFullYear();
  }
  function durationToSeconds(str) {
    const p = str.split(":").map(Number);
    return p[0] * 3600 + p[1] * 60 + p[2];
  }

  const PLATFORM_META = {
    zoom: { label: "Zoom", icon: "assets/Zoom.svg" },
    teams: { label: "Teams", icon: "assets/teams.svg" },
    meet: { label: "Google Meet", icon: "assets/gmeet.svg" },
  };

  const RECORDING_FORMATS = [
    { value: "wav", label: "WAV — lossless (largest)" },
    { value: "flac", label: "FLAC — lossless compressed" },
    { value: "m4a", label: "M4A / AAC — balanced" },
    { value: "mp3", label: "MP3 — smallest" },
  ];
  const MIC_DEVICES = [
    { value: "macbook-mic", label: "MacBook Pro Microphone" },
    { value: "usb-mic", label: "Shure MV7 (USB)" },
    { value: "airpods", label: "AirPods Pro" },
  ];
  const SYSTEM_AUDIO_DEVICES = [
    { value: "loopback", label: "System Audio (loopback)" },
    { value: "blackhole", label: "BlackHole 2ch" },
    { value: "aggregate", label: "Aggregate Device" },
  ];
  const SYSTEM_AUDIO_BACKENDS = [
    { value: "screencapturekit", label: "ScreenCaptureKit (recommended)" },
    { value: "coreaudio", label: "CoreAudio" },
    { value: "blackhole", label: "BlackHole driver" },
  ];
  const TRANSCRIPTION_MODELS = [
    { value: "whisper", label: "Whisper (OpenAI)", variants: [
      { value: "tiny", label: "tiny — fastest" },
      { value: "base", label: "base" },
      { value: "small", label: "small" },
      { value: "medium", label: "medium" },
      { value: "large-v3", label: "large-v3 — most accurate" },
    ]},
    { value: "parakeet", label: "Parakeet (NVIDIA)", variants: [
      { value: "0.6b", label: "0.6B" },
      { value: "1.1b", label: "1.1B" },
    ]},
    { value: "deepgram", label: "Deepgram Nova", variants: [
      { value: "nova-2", label: "nova-2" },
      { value: "nova-3", label: "nova-3" },
    ]},
  ];
  const SUMMARY_MODELS = [
    { value: "claude", label: "Claude (Anthropic)", local: false, variants: [
      { value: "haiku", label: "Haiku — fast" },
      { value: "sonnet", label: "Sonnet — balanced" },
      { value: "opus", label: "Opus — most capable" },
    ]},
    { value: "gpt", label: "GPT (OpenAI)", local: false, variants: [
      { value: "gpt-4o-mini", label: "gpt-4o-mini" },
      { value: "gpt-4o", label: "gpt-4o" },
    ]},
    { value: "llama", label: "Llama (local)", local: true, variants: [
      { value: "8b", label: "Llama 3.1 8B" },
      { value: "70b", label: "Llama 3.1 70B" },
    ]},
    { value: "qwen", label: "Qwen (local)", local: true, variants: [
      { value: "7b", label: "Qwen 2.5 7B" },
      { value: "14b", label: "Qwen 2.5 14B" },
      { value: "32b", label: "Qwen 2.5 32B" },
    ]},
  ];
  const SUMMARY_LANGUAGES = [
    { value: "auto", label: "Auto (dominant transcript language)" },
    { value: "en", label: "English" },
    { value: "es", label: "Spanish" },
    { value: "fr", label: "French" },
    { value: "de", label: "German" },
    { value: "hi", label: "Hindi" },
    { value: "ja", label: "Japanese" },
    { value: "zh", label: "Chinese" },
    { value: "pt", label: "Portuguese" },
  ];

  const RAW_MEETINGS = [
    {
      id: "m1", title: "Software Engineer — Final Round", company: "Acme Robotics",
      date: "Jul 2, 2026", dateISO: "2026-07-02", time: "2:00 PM", duration: "00:42:10", platform: "zoom",
      interviewer: { name: "Renee Okafor", email: "renee.okafor@acmerobotics.com" },
      highlights: [
        "Asked to design a rate limiter on the whiteboard.",
        "Pushed back when the distributed case was skipped — cost time.",
        "Strong two-way rapport with the hiring manager.",
        "They flagged shallow depth on distributed systems.",
        "Team is remote-first; standups run 9:30am PT.",
        "Next round: system design + team meet-and-greet.",
      ],
      actionItems: [
        { text: "Send a thank-you note today, mentioning the rate-limiter question", done: false },
        { text: "Review token-bucket vs. sliding-window rate limiting trade-offs", done: false },
        { text: "Ask the recruiter for the comp band before the next round", done: true },
        { text: "Practice one more distributed-systems mock — weak spot twice now", done: false },
      ],
      comments: "Felt rushed on the whiteboard — bring a scratch pad next time.",
      transcript: [
        { speaker: "Renee (Interviewer)", time: "02:14", text: "Let’s start with a design problem — how would you build a rate limiter for a public API?" },
        { speaker: "You", time: "02:40", text: "I’d start with a token bucket per client key, backed by a fast in-memory store." },
        { speaker: "Renee (Interviewer)", time: "05:02", text: "What happens when that store lives across multiple regions?" },
        { speaker: "You", time: "05:30", text: "Honestly, that’s the part I’d want to research more — I’d lean toward regional counters reconciled asynchronously." },
        { speaker: "Renee (Interviewer)", time: "18:20", text: "Let’s switch gears — tell me about a time you disagreed with a teammate." },
      ],
    },
    {
      id: "m2", title: "Product Designer — Portfolio Review", company: "Lumen Health",
      date: "Jul 1, 2026", dateISO: "2026-07-01", time: "11:00 AM", duration: "00:38:45", platform: "meet",
      interviewer: { name: "Priya Chandran", email: "priya.chandran@lumenhealth.io" },
      highlights: [
        "Walked through the onboarding redesign case study.",
        "They liked the before/after metrics slide.",
        "Asked how designer-eng disagreements get resolved.",
        "Mentioned a research-ops opening too.",
        "Team ships on a two-week cadence.",
      ],
      actionItems: [
        { text: "Send the Figma file with edit access", done: false },
        { text: "Note the research-ops opening for later", done: false },
        { text: "Draft a short answer on handling design pushback", done: false },
      ],
      comments: "",
      transcript: [],
    },
    {
      id: "m3", title: "Backend Engineer — Take-home Debrief", company: "Cedarwood Data",
      date: "Jun 29, 2026", dateISO: "2026-06-29", time: "4:30 PM", duration: "00:51:02", platform: "teams",
      interviewer: { name: "Marcus Webb", email: "marcus.webb@cedarwooddata.com" },
      highlights: [
        "Walked through the take-home’s schema choices.",
        "Questioned why the join table wasn’t indexed.",
        "Liked the edge-case test coverage.",
        "Asked about schema migrations at scale.",
        "Said a decision is expected within a week.",
      ],
      actionItems: [
        { text: "Follow up in 5 business days if no word back", done: false },
        { text: "Write up the indexing fix as a talking point for next time", done: true },
      ],
      comments: "",
      transcript: [
        { speaker: "Marcus (Interviewer)", time: "04:10", text: "Walk me through why you structured the join table this way." },
        { speaker: "You", time: "04:35", text: "I optimized for write simplicity, but I didn’t add an index on the foreign key — I’d fix that first." },
        { speaker: "Marcus (Interviewer)", time: "22:00", text: "How would this hold up if the table hit 50 million rows?" },
        { speaker: "You", time: "22:20", text: "It would degrade on the unindexed lookups — I’d partition by tenant and add that index." },
      ],
    },
    {
      id: "m4", title: "Customer Success Lead — Intro Call", company: "Northwind Labs",
      date: "Jun 27, 2026", dateISO: "2026-06-27", time: "9:00 AM", duration: "00:24:18", platform: "zoom",
      interviewer: { name: "Dana Kowalski", email: "dana.k@northwindlabs.com" },
      highlights: [
        "Screening call, mostly background questions.",
        "Asked about handling an angry enterprise customer.",
        "Salary expectations discussed — gave a range.",
        "Recruiter will loop in the hiring manager next.",
      ],
      actionItems: [
        { text: "Send the churn-recovery case-study writeup", done: false },
        { text: "Confirm availability for the hiring-manager round", done: false },
      ],
      comments: "",
      transcript: [],
    },
    {
      id: "m5", title: "Frontend Engineer — Panel Interview", company: "Brightline",
      date: "Jun 24, 2026", dateISO: "2026-06-24", time: "1:00 PM", duration: "01:05:40", platform: "meet",
      interviewer: { name: "Panel (3)", email: "panel@brightline.dev" },
      highlights: [
        "Three-person panel, rotated through React and CSS questions.",
        "Nailed the accessibility question on focus traps.",
        "Blanked on a CSS specificity question — needs review.",
        "Asked about testing philosophy — unit vs. e2e.",
        "Good energy from the panel by the end.",
      ],
      actionItems: [
        { text: "Review CSS specificity and cascade layers", done: false },
        { text: "Send a follow-up note to all three panelists", done: false },
        { text: "Prep a testing-philosophy answer with real examples", done: false },
      ],
      comments: "Panel interviews move fast — keep answers under 90 seconds.",
      transcript: [
        { speaker: "Panelist 1", time: "08:00", text: "How would you make a modal accessible for keyboard users?" },
        { speaker: "You", time: "08:20", text: "Trap focus inside it, restore focus on close, and label it with aria-modal." },
        { speaker: "Panelist 2", time: "31:00", text: "Which selector wins here — a class or an attribute selector of equal specificity written later?" },
        { speaker: "You", time: "31:25", text: "I froze on that one — I’d want to double check the exact specificity math." },
      ],
    },
    {
      id: "m6", title: "Data Analyst — Screening Call", company: "Fathom Analytics",
      date: "Jun 20, 2026", dateISO: "2026-06-20", time: "3:00 PM", duration: "00:19:52", platform: "zoom",
      interviewer: { name: "Alicia Tran", email: "alicia.tran@fathom.io" },
      highlights: [
        "Quick fit check, no technical questions.",
        "Asked why I’m looking to leave my current focus area.",
        "Confirmed remote-only works for this role.",
      ],
      actionItems: [
        { text: "No action needed yet — waiting to hear back", done: true },
      ],
      comments: "",
      transcript: [],
    },
    {
      id: "m7", title: "UX Researcher — Hiring Manager Chat", company: "Glasswing",
      date: "Jun 18, 2026", dateISO: "2026-06-18", time: "10:30 AM", duration: "00:33:15", platform: "teams",
      interviewer: { name: "Tom Reyes", email: "tom.reyes@glasswing.design" },
      highlights: [
        "Deep dive on a mixed-methods study led previously.",
        "Asked how I push back on stakeholders who ignore research.",
        "Team is rebuilding its research repository.",
        "Good signal — asked about notice period.",
      ],
      actionItems: [
        { text: "Send two writing samples by Friday", done: false },
        { text: "Prepare a story about stakeholder pushback", done: false },
      ],
      comments: "",
      transcript: [],
    },
    {
      id: "m8", title: "DevOps Engineer — Technical Screen", company: "Ridgeline Systems",
      date: "Jun 15, 2026", dateISO: "2026-06-15", time: "4:00 PM", duration: "00:47:30", platform: "meet",
      interviewer: { name: "Kwame Asante", email: "kwame.asante@ridgeline.systems" },
      highlights: [
        "Live-debugged a broken CI pipeline.",
        "Found the fix but initially missed it was a caching issue.",
        "Asked about on-call experience and rotation comfort.",
        "Said the next step would be a system design round.",
      ],
      actionItems: [
        { text: "Review CI caching pitfalls before the next round", done: false },
        { text: "Ask about the on-call compensation structure", done: false },
      ],
      comments: "",
      transcript: [],
    },
  ];

  function seedMeetings() {
    return RAW_MEETINGS.map((m) => ({
      ...m,
      actionItems: m.actionItems.map((a, i) => ({ id: m.id + "-a" + i, text: a.text, done: a.done })),
    }));
  }

  global.Data = {
    fmtDuration, fmtShortDate, durationToSeconds,
    PLATFORM_META, RECORDING_FORMATS, MIC_DEVICES, SYSTEM_AUDIO_DEVICES, SYSTEM_AUDIO_BACKENDS,
    TRANSCRIPTION_MODELS, SUMMARY_MODELS, SUMMARY_LANGUAGES, seedMeetings,
  };
})(window);
