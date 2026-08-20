window.__ModuleLoader__.load({ id: 'dsh-notify', factory: (require) => { var module = { exports: {} }; var exports = module.exports;
"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/client/index.ts
var index_exports = {};
__export(index_exports, {
  apply: () => apply,
  inject: () => inject
});
module.exports = __toCommonJS(index_exports);

// src/client/decision.ts
function asReason(reason) {
  switch (reason) {
    case "completed":
    case "error":
    case "aborted":
    case "blocked":
    case "max-tokens":
      return reason;
    case "interrupted":
      return "aborted";
    default:
      return void 0;
  }
}
function toneOf(reason) {
  return reason === "completed" ? "success" : "error";
}
function reasonEnabled(settings, reason) {
  switch (reason) {
    case "completed":
      return settings.notifyCompleted;
    case "error":
      return settings.notifyError;
    case "aborted":
      return settings.notifyAborted;
    case "blocked":
      return settings.notifyBlocked;
    case "max-tokens":
      return settings.notifyMaxTokens;
  }
}

// src/client/dingtalk.ts
var ENDPOINT = "/api/dsh-notify/dingtalk";
async function responseJson(response) {
  const value = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(typeof value.error === "string" ? value.error : `Request failed (HTTP ${response.status})`);
  }
  return value;
}
async function loadDingTalkSettings() {
  return responseJson(await fetch(ENDPOINT, {
    method: "GET",
    headers: { accept: "application/json" }
  }));
}
async function saveDingTalkSettings(update) {
  return responseJson(await fetch(ENDPOINT, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(update)
  }));
}
async function sendDingTalkTest() {
  await responseJson(await fetch(ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ action: "test" })
  }));
}

// src/client/favicon.ts
var IDLE_COLOR = "#3964fe";
function colorizeFavicon(svg) {
  return svg.replace(/fill=(['"])(?:#000000|#000|#ffffff|#fff)\1/gi, 'fill="' + IDLE_COLOR + '"').replace(/fill:\s*(?:#000000|#000|#ffffff|#fff)/gi, "fill: " + IDLE_COLOR);
}
var FaviconNotifier = class {
  constructor(target = document, load = async (href, signal) => {
    const response = await fetch(href, { signal });
    if (!response.ok) throw new Error("favicon request failed: " + String(response.status));
    return response.text();
  }) {
    this.target = target;
    this.load = load;
  }
  target;
  load;
  link;
  request = 0;
  pending = false;
  active = false;
  controller;
  dataUrl;
  render(active) {
    this.active = active;
    if (!active) {
      this.dispose();
      return;
    }
    if (this.dataUrl !== void 0) {
      this.install(this.dataUrl);
      return;
    }
    if (this.pending) return;
    const source = this.target.querySelector('link[rel~="icon"]:not([data-dsh-notify-favicon])');
    if (source === null) return;
    const request = ++this.request;
    const controller = new AbortController();
    this.controller = controller;
    this.pending = true;
    void this.load(source.href, controller.signal).then((svg) => {
      if (request !== this.request || !this.active) return;
      this.dataUrl = "data:image/svg+xml," + encodeURIComponent(colorizeFavicon(svg));
      this.install(this.dataUrl);
    }).catch(() => {
    }).finally(() => {
      if (request !== this.request) return;
      this.pending = false;
      this.controller = void 0;
    });
  }
  dispose() {
    this.active = false;
    this.pending = false;
    this.controller?.abort();
    this.controller = void 0;
    this.request += 1;
    this.link?.remove();
    this.link = void 0;
  }
  install(href) {
    const link = this.link?.isConnected === true ? this.link : this.target.createElement("link");
    link.rel = "icon";
    link.type = "image/svg+xml";
    link.dataset.dshNotifyFavicon = "";
    link.href = href;
    if (!link.isConnected) this.target.head.append(link);
    this.link = link;
  }
};

// src/client/SettingsSection.tsx
var import_react = require("react");

// src/client/notifier.ts
function notificationsApi() {
  return typeof Notification === "undefined" ? void 0 : Notification;
}
function createNotification(api, title, options) {
  try {
    return new api(title, options);
  } catch (error) {
    console.warn("[dsh-notify] browser notification could not be created", error);
    return void 0;
  }
}
var NotificationRegistry = class {
  active = /* @__PURE__ */ new Set();
  track(notification) {
    this.active.add(notification);
    notification.onclose = () => {
      this.active.delete(notification);
    };
  }
  closeAll() {
    for (const notification of this.active) {
      notification.onclick = null;
      notification.onclose = null;
      notification.close();
    }
    this.active.clear();
  }
};
function shouldShowSystem(permission, settings, documentHidden, completedSessionId, currentSessionId) {
  if (!settings.enabled || !settings.systemNotifications || permission !== "granted") return false;
  return !settings.backgroundOnly || documentHidden || completedSessionId !== currentSessionId;
}
function notificationTitleKey(reason) {
  switch (reason) {
    case "completed":
      return "notify.completed";
    case "error":
      return "notify.error";
    case "aborted":
      return "notify.aborted";
    case "blocked":
      return "notify.blocked";
    case "max-tokens":
      return "notify.maxTokens";
  }
}
function notificationBody(entry, fallback, maxBodyChars) {
  const source = entry.body.trim() === "" ? fallback : entry.body.trim();
  const characters = Array.from(source);
  const body = characters.length <= maxBodyChars ? source : characters.slice(0, Math.max(0, maxBodyChars - 1)).join("") + "\u2026";
  return `${entry.title}: ${body}`;
}

// src/client/state.ts
var DEFAULT_MAX_BODY_CHARS = 400;
var MIN_MAX_BODY_CHARS = 100;
var MAX_MAX_BODY_CHARS = 2e3;
function validMaxBodyChars(value) {
  return typeof value === "number" && Number.isInteger(value) && value >= MIN_MAX_BODY_CHARS && value <= MAX_MAX_BODY_CHARS;
}
function defaultNotificationSettings() {
  return {
    enabled: true,
    systemNotifications: true,
    titleNotifications: true,
    runningTitleIndicator: true,
    idleTitleAnimation: true,
    idleFaviconIndicator: false,
    sidebarIndicators: true,
    titleAnimation: "marquee",
    maxBodyChars: DEFAULT_MAX_BODY_CHARS,
    backgroundOnly: false,
    notifyCompleted: true,
    notifyError: true,
    notifyAborted: true,
    notifyBlocked: true,
    notifyMaxTokens: true
  };
}
function booleanOr(value, fallback) {
  return typeof value === "boolean" ? value : fallback;
}
function normalizeNotificationSettings(value) {
  const defaults = defaultNotificationSettings();
  const source = value !== null && typeof value === "object" && !Array.isArray(value) ? value : {};
  const animation = source.titleAnimation === "blink" || source.titleAnimation === "marquee" ? source.titleAnimation : defaults.titleAnimation;
  return {
    enabled: booleanOr(source.enabled, defaults.enabled),
    systemNotifications: booleanOr(source.systemNotifications, defaults.systemNotifications),
    titleNotifications: booleanOr(source.titleNotifications, defaults.titleNotifications),
    runningTitleIndicator: booleanOr(source.runningTitleIndicator, defaults.runningTitleIndicator),
    idleTitleAnimation: booleanOr(source.idleTitleAnimation, defaults.idleTitleAnimation),
    idleFaviconIndicator: booleanOr(source.idleFaviconIndicator, defaults.idleFaviconIndicator),
    sidebarIndicators: booleanOr(source.sidebarIndicators, defaults.sidebarIndicators),
    titleAnimation: animation,
    maxBodyChars: validMaxBodyChars(source.maxBodyChars) ? source.maxBodyChars : defaults.maxBodyChars,
    backgroundOnly: booleanOr(source.backgroundOnly, defaults.backgroundOnly),
    notifyCompleted: booleanOr(source.notifyCompleted, defaults.notifyCompleted),
    notifyError: booleanOr(source.notifyError, defaults.notifyError),
    notifyAborted: booleanOr(source.notifyAborted, defaults.notifyAborted),
    notifyBlocked: booleanOr(source.notifyBlocked, defaults.notifyBlocked),
    notifyMaxTokens: booleanOr(source.notifyMaxTokens, defaults.notifyMaxTokens)
  };
}
function filterAttentionBySettings(state, settings) {
  const allowed = settings.enabled ? Object.fromEntries(Object.entries(state.bySession).filter(([, entry]) => reasonEnabled(settings, entry.reason))) : {};
  return Object.keys(allowed).length === Object.keys(state.bySession).length ? state : { bySession: allowed };
}
function putAttention(state, entry) {
  return { bySession: { ...state.bySession, [entry.sessionId]: entry } };
}
function clearAttention(state, sessionId) {
  if (state.bySession[sessionId] === void 0) return state;
  const next = { ...state.bySession };
  delete next[sessionId];
  return { bySession: next };
}
function retainAttention(state, sessionIds) {
  const next = Object.fromEntries(Object.entries(state.bySession).filter(([id]) => sessionIds.has(id)));
  return Object.keys(next).length === Object.keys(state.bySession).length ? state : { bySession: next };
}
function attentionEntries(state) {
  return Object.values(state.bySession).sort((a, b) => a.createdAt - b.createdAt);
}
function runningConversationCount(ids, byId) {
  const active = /* @__PURE__ */ new Set();
  for (const id of ids) {
    const initial = byId[id];
    if (initial?.running !== true) continue;
    let current = initial;
    const visited = /* @__PURE__ */ new Set();
    while (current.origin === "subagent" && current.parentId !== void 0 && !visited.has(current.id)) {
      visited.add(current.id);
      const parent = byId[current.parentId];
      if (parent === void 0) break;
      current = parent;
    }
    active.add(current.id);
  }
  return active.size;
}

// src/client/SettingsSection.tsx
var import_jsx_runtime = require("react/jsx-runtime");
var DINGTALK_DOCS = "https://open.dingtalk.com/document/dingstart/custom-bot-creation-and-installation";
function Toggle({ checked, label, desc, disabled = false, onChange }) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { className: "dsh_notify_toggle", "data-disabled": disabled ? "true" : "false", children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { type: "checkbox", checked, disabled, onChange: (event) => {
      onChange(event.target.checked);
    } }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: label }),
      desc === void 0 ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: desc })
    ] })
  ] });
}
function MaxBodyCharsSetting({ value, set, t }) {
  const [input, setInput] = (0, import_react.useState)(String(value));
  (0, import_react.useEffect)(() => {
    setInput(String(value));
  }, [value]);
  const parsed = Number(input);
  const valid = input.trim() !== "" && validMaxBodyChars(parsed);
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { className: "dsh_notify_numberField", children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: t("settings.system.maxBodyChars") }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      "input",
      {
        type: "number",
        min: MIN_MAX_BODY_CHARS,
        max: MAX_MAX_BODY_CHARS,
        step: 1,
        value: input,
        "aria-invalid": !valid,
        "aria-describedby": "dsh-notify-max-body-desc",
        onChange: (event) => {
          const next = event.target.value;
          setInput(next);
          const number = Number(next);
          if (next.trim() !== "" && validMaxBodyChars(number)) set({ maxBodyChars: number });
        }
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { id: "dsh-notify-max-body-desc", "data-error": !valid ? "true" : "false", children: t(valid ? "settings.system.maxBodyCharsDesc" : "settings.system.maxBodyCharsError") })
  ] });
}
var OUTCOMES = [
  { field: "notifyCompleted", key: "settings.outcomes.completed" },
  { field: "notifyError", key: "settings.outcomes.error" },
  { field: "notifyAborted", key: "settings.outcomes.aborted" },
  { field: "notifyBlocked", key: "settings.outcomes.blocked" },
  { field: "notifyMaxTokens", key: "settings.outcomes.maxTokens" }
];
function SecretVisibilityIcon({ visible }) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", { className: "dsh_notify_eyeIcon", viewBox: "0 0 1024 1024", "aria-hidden": "true", focusable: "false", children: visible ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M876.8 156.8c0-9.6-3.2-16-9.6-22.4s-12.8-9.6-22.4-9.6-16 3.2-22.4 9.6L736 220.8c-64-32-137.6-51.2-224-60.8-160 16-288 73.6-377.6 176S0 496 0 512s48 73.6 134.4 176c22.4 25.6 44.8 48 73.6 67.2l-86.4 89.6c-6.4 6.4-9.6 12.8-9.6 22.4s3.2 16 9.6 22.4 12.8 9.6 22.4 9.6 16-3.2 22.4-9.6l704-710.4c3.2-6.4 6.4-12.8 6.4-22.4m-646.4 528Q115.2 579.2 76.8 512q43.2-72 153.6-172.8C304 272 400 230.4 512 224c64 3.2 124.8 19.2 176 44.8l-54.4 54.4C598.4 300.8 560 288 512 288c-64 0-115.2 22.4-160 64s-64 96-64 160c0 48 12.8 89.6 35.2 124.8L256 707.2c-9.6-6.4-19.2-16-25.6-22.4m140.8-96Q352 555.2 352 512c0-44.8 16-83.2 48-112s67.2-48 112-48c28.8 0 54.4 6.4 73.6 19.2zM889.599 336c-12.8-16-28.8-28.8-41.6-41.6l-48 48c73.6 67.2 124.8 124.8 150.4 169.6q-43.2 72-153.6 172.8c-73.6 67.2-172.8 108.8-284.8 115.2-51.2-3.2-99.2-12.8-140.8-28.8l-48 48c57.6 22.4 118.4 38.4 188.8 44.8 160-16 288-73.6 377.6-176S1024 528 1024 512s-48.001-73.6-134.401-176" }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M511.998 672c-12.8 0-25.6-3.2-38.4-6.4l-51.2 51.2c28.8 12.8 57.6 19.2 89.6 19.2 64 0 115.2-22.4 160-64 41.6-41.6 64-96 64-160 0-32-6.4-64-19.2-89.6l-51.2 51.2c3.2 12.8 6.4 25.6 6.4 38.4 0 44.8-16 83.2-48 112s-67.2 48-112 48" })
  ] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M512 160c320 0 512 352 512 352S832 864 512 864 0 512 0 512s192-352 512-352m0 64c-225.28 0-384.128 208.064-436.8 288 52.608 79.872 211.456 288 436.8 288 225.28 0 384.128-208.064 436.8-288-52.608-79.872-211.456-288-436.8-288m0 64a224 224 0 1 1 0 448 224 224 0 0 1 0-448m0 64a160.19 160.19 0 0 0-160 160c0 88.192 71.744 160 160 160s160-71.808 160-160-71.744-160-160-160" }) });
}
function SecretInput({ label, value, placeholder, onChange, t }) {
  const [visible, setVisible] = (0, import_react.useState)(false);
  const action = t(visible ? "settings.dingtalk.hideSecret" : "settings.dingtalk.showSecret");
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: label }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: "dsh_notify_secretInput", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { type: visible ? "text" : "password", autoComplete: "off", value, placeholder, onChange: (event) => {
        onChange(event.target.value);
      } }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", "aria-label": `${action}: ${label}`, title: action, "aria-pressed": visible, onClick: () => {
        setVisible((current) => !current);
      }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SecretVisibilityIcon, { visible }) })
    ] })
  ] });
}
function DingTalkSettings({ loadDingTalk, saveDingTalk, testDingTalk, t }) {
  const [settings, setSettings] = (0, import_react.useState)(null);
  const [accessToken, setAccessToken] = (0, import_react.useState)("");
  const [signingSecret, setSigningSecret] = (0, import_react.useState)("");
  const [busy, setBusy] = (0, import_react.useState)(null);
  const [status, setStatus] = (0, import_react.useState)(null);
  (0, import_react.useEffect)(() => {
    let active = true;
    void loadDingTalk().then((value) => {
      if (active) setSettings(value);
    }).catch((error) => {
      if (active) setStatus({ tone: "error", text: error instanceof Error ? error.message : String(error) });
    });
    return () => {
      active = false;
    };
  }, [loadDingTalk]);
  const patch = (field, value) => {
    setSettings((current) => current === null ? current : { ...current, [field]: value });
    setStatus(null);
  };
  const save = async () => {
    if (settings === null) return;
    if (accessToken.trim() === "" !== (signingSecret.trim() === "")) {
      setStatus({ tone: "error", text: t("settings.dingtalk.credentialsTogether") });
      return;
    }
    setBusy("save");
    setStatus(null);
    try {
      const next = await saveDingTalk({
        accessToken: accessToken.trim() || void 0,
        signingSecret: signingSecret.trim() || void 0,
        notifyCompleted: settings.notifyCompleted,
        notifyFailed: settings.notifyFailed,
        quietHoursEnabled: settings.quietHoursEnabled,
        quietHoursStart: settings.quietHoursStart,
        quietHoursEnd: settings.quietHoursEnd,
        notifyMissed: settings.notifyMissed
      });
      setSettings(next);
      setAccessToken("");
      setSigningSecret("");
      setStatus({ tone: "success", text: t("settings.dingtalk.saved") });
    } catch (error) {
      setStatus({ tone: "error", text: error instanceof Error ? error.message : String(error) });
    } finally {
      setBusy(null);
    }
  };
  const clear2 = async () => {
    if (settings === null) return;
    setBusy("clear");
    setStatus(null);
    try {
      const next = await saveDingTalk({
        clearCredentials: true,
        notifyCompleted: settings.notifyCompleted,
        notifyFailed: settings.notifyFailed,
        quietHoursEnabled: settings.quietHoursEnabled,
        quietHoursStart: settings.quietHoursStart,
        quietHoursEnd: settings.quietHoursEnd,
        notifyMissed: settings.notifyMissed
      });
      setSettings(next);
      setAccessToken("");
      setSigningSecret("");
      setStatus({ tone: "success", text: t("settings.dingtalk.cleared") });
    } catch (error) {
      setStatus({ tone: "error", text: error instanceof Error ? error.message : String(error) });
    } finally {
      setBusy(null);
    }
  };
  const test = async () => {
    setBusy("test");
    setStatus(null);
    try {
      await testDingTalk();
      setStatus({ tone: "success", text: t("settings.dingtalk.testSent") });
    } catch (error) {
      setStatus({ tone: "error", text: error instanceof Error ? error.message : String(error) });
    } finally {
      setBusy(null);
    }
  };
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsh_notify_group", children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsh_notify_groupHeading", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { children: t("settings.dingtalk.title") }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: t("settings.dingtalk.desc") })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", className: "dsh_notify_button", onClick: () => {
        window.open(DINGTALK_DOCS, "_blank", "noopener,noreferrer");
      }, children: t("settings.dingtalk.docs") })
    ] }),
    settings === null ? status === null ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: "dsh_notify_hint", children: t("settings.dingtalk.loading") }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: "dsh_notify_feedback", "data-tone": "error", children: status.text }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsh_notify_statusLine", "data-configured": settings.configured ? "true" : "false", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { "aria-hidden": "true" }),
        settings.configured ? t("settings.dingtalk.configured") : t("settings.dingtalk.notConfigured")
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsh_notify_fields", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SecretInput, { label: "Access Token", value: accessToken, placeholder: settings.configured ? t("settings.dingtalk.keepValue") : "", t, onChange: (value) => {
          setAccessToken(value);
          setStatus(null);
        } }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SecretInput, { label: "Signing Secret", value: signingSecret, placeholder: settings.configured ? t("settings.dingtalk.keepValue") : "", t, onChange: (value) => {
          setSigningSecret(value);
          setStatus(null);
        } })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsh_notify_subgroup", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: t("settings.dingtalk.outcomes") }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsh_notify_outcomes", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toggle, { checked: settings.notifyCompleted, label: t("settings.dingtalk.completed"), onChange: (checked) => {
            patch("notifyCompleted", checked);
          } }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toggle, { checked: settings.notifyFailed, label: t("settings.dingtalk.failed"), desc: t("settings.dingtalk.failedDesc"), onChange: (checked) => {
            patch("notifyFailed", checked);
          } })
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsh_notify_subgroup", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toggle, { checked: settings.quietHoursEnabled, label: t("settings.dingtalk.quiet"), desc: t("settings.dingtalk.quietDesc"), onChange: (checked) => {
          patch("quietHoursEnabled", checked);
        } }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsh_notify_timeRange", "data-disabled": !settings.quietHoursEnabled ? "true" : "false", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: t("settings.dingtalk.start") }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { type: "time", disabled: !settings.quietHoursEnabled, value: settings.quietHoursStart, onChange: (event) => {
              patch("quietHoursStart", event.target.value);
            } })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { "aria-hidden": "true", children: "-" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: t("settings.dingtalk.end") }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { type: "time", disabled: !settings.quietHoursEnabled, value: settings.quietHoursEnd, onChange: (event) => {
              patch("quietHoursEnd", event.target.value);
            } })
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toggle, { checked: settings.notifyMissed, disabled: !settings.quietHoursEnabled, label: t("settings.dingtalk.missed"), onChange: (checked) => {
          patch("notifyMissed", checked);
        } })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsh_notify_actions", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", className: "dsh_notify_button dsh_notify_buttonPrimary", disabled: busy !== null, onClick: () => {
          void save();
        }, children: busy === "save" ? t("settings.dingtalk.saving") : t("settings.dingtalk.save") }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", className: "dsh_notify_button", disabled: busy !== null || !settings.configured, onClick: () => {
          void test();
        }, children: busy === "test" ? t("settings.dingtalk.testing") : t("settings.dingtalk.test") }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", className: "dsh_notify_button dsh_notify_buttonDanger", disabled: busy !== null || !settings.configured, onClick: () => {
          void clear2();
        }, children: busy === "clear" ? t("settings.dingtalk.clearing") : t("settings.dingtalk.clear") })
      ] }),
      status === null ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: "dsh_notify_feedback", "data-tone": status.tone, children: status.text })
    ] })
  ] });
}
function NotifySettingsSection({ useSettings, set, requestPermission, sendTest, loadDingTalk, saveDingTalk, testDingTalk, t }) {
  const settings = useSettings((value) => value);
  const [permission, setPermission] = (0, import_react.useState)(() => notificationsApi()?.permission ?? "denied");
  const [hint, setHint] = (0, import_react.useState)(null);
  (0, import_react.useEffect)(() => {
    const refresh = () => {
      setPermission(notificationsApi()?.permission ?? "denied");
    };
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, []);
  const change = (field, checked) => {
    set({ [field]: checked });
  };
  const authorize = async () => {
    const next = await requestPermission();
    setPermission(next);
    setHint(next === "granted" ? null : next === "denied" ? "settings.permission.deniedHint" : "settings.permission.defaultHint");
    return next;
  };
  const test = async () => {
    const current = notificationsApi()?.permission === "granted" ? "granted" : await authorize();
    if (current === "granted") sendTest();
  };
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { className: "dsh_notify_settings", "aria-labelledby": "dsh-notify-heading", children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", { children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { id: "dsh-notify-heading", children: t("settings.title") }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: t("settings.subtitle") })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "dsh_notify_group", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toggle, { checked: settings.enabled, label: t("settings.enabled"), desc: t("settings.enabledDesc"), onChange: (checked) => {
      change("enabled", checked);
    } }) }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsh_notify_group", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { children: t("settings.system.title") }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toggle, { checked: settings.systemNotifications, label: t("settings.system.enabled"), onChange: (checked) => {
        change("systemNotifications", checked);
      } }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toggle, { checked: settings.backgroundOnly, label: t("settings.system.backgroundOnly"), onChange: (checked) => {
        change("backgroundOnly", checked);
      } }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MaxBodyCharsSetting, { value: settings.maxBodyChars, set, t }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsh_notify_permission", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
          t("settings.permission.title"),
          ": ",
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { "data-permission": permission, children: t(`settings.permission.${permission}`) })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", onClick: () => {
          void authorize();
        }, children: t("settings.permission.request") }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", onClick: () => {
          void test();
        }, children: t("settings.permission.test") })
      ] }),
      hint === null ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: "dsh_notify_hint", children: t(hint) })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DingTalkSettings, { loadDingTalk, saveDingTalk, testDingTalk, t }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsh_notify_group", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { children: t("settings.titleSurface.title") }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toggle, { checked: settings.titleNotifications, label: t("settings.titleSurface.enabled"), onChange: (checked) => {
        change("titleNotifications", checked);
      } }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toggle, { checked: settings.runningTitleIndicator, label: t("settings.titleSurface.running"), onChange: (checked) => {
        change("runningTitleIndicator", checked);
      } }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toggle, { checked: settings.idleTitleAnimation, label: t("settings.titleSurface.idleAnimation"), desc: t("settings.titleSurface.idleAnimationDesc"), onChange: (checked) => {
        change("idleTitleAnimation", checked);
      } }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toggle, { checked: settings.idleFaviconIndicator, label: t("settings.titleSurface.idleFavicon"), desc: t("settings.titleSurface.idleFaviconDesc"), onChange: (checked) => {
        change("idleFaviconIndicator", checked);
      } }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsh_notify_segment", role: "group", "aria-label": t("settings.titleSurface.animation"), children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", "aria-pressed": settings.titleAnimation === "marquee", onClick: () => {
          set({ titleAnimation: "marquee" });
        }, children: t("settings.titleSurface.marquee") }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", "aria-pressed": settings.titleAnimation === "blink", onClick: () => {
          set({ titleAnimation: "blink" });
        }, children: t("settings.titleSurface.blink") })
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsh_notify_group", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { children: t("settings.sidebar.title") }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toggle, { checked: settings.sidebarIndicators, label: t("settings.sidebar.enabled"), desc: t("settings.sidebar.desc"), onChange: (checked) => {
        change("sidebarIndicators", checked);
      } })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsh_notify_group", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { children: t("settings.outcomes.title") }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "dsh_notify_outcomes", children: OUTCOMES.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toggle, { checked: settings[item.field], label: t(item.key), onChange: (checked) => {
        change(item.field, checked);
      } }, item.field)) })
    ] })
  ] });
}

// src/client/locales.ts
var zh = {
  nav: "\u901A\u77E5",
  "settings.title": "\u901A\u77E5\u4E0E\u4EFB\u52A1\u72B6\u6001",
  "settings.subtitle": "\u4EC5\u5728\u9876\u5C42\u4EFB\u52A1\u5168\u90E8\u6536\u655B\u540E\u663E\u793A\u7ED3\u679C\uFF1B\u5B50\u4EE3\u7406\u548C\u540E\u53F0\u542F\u52A8\u8F6E\u4E0D\u4F1A\u5355\u72EC\u901A\u77E5\u3002",
  "settings.enabled": "\u542F\u7528\u901A\u77E5",
  "settings.enabledDesc": "\u5173\u95ED\u6240\u6709\u7531 dsh-notify \u63D0\u4F9B\u7684\u901A\u77E5\u548C\u72B6\u6001\u6807\u8BB0\u3002",
  "settings.system.title": "\u7CFB\u7EDF\u901A\u77E5",
  "settings.system.enabled": "\u5F39\u51FA\u7CFB\u7EDF\u901A\u77E5",
  "settings.system.backgroundOnly": "\u4EC5\u5728\u4EFB\u52A1\u4E0D\u5728\u773C\u524D\u65F6\u5F39\u51FA",
  "settings.system.maxBodyChars": "\u901A\u77E5\u6B63\u6587\u6700\u5927\u5B57\u7B26\u6570",
  "settings.system.maxBodyCharsDesc": "\u53EF\u8BBE\u7F6E 100\u20132000\uFF0C\u9ED8\u8BA4 400\uFF1B\u8D85\u51FA\u90E8\u5206\u4EE5\u7701\u7565\u53F7\u622A\u65AD\u3002",
  "settings.system.maxBodyCharsError": "\u8BF7\u8F93\u5165 100\u20132000 \u4E4B\u95F4\u7684\u6574\u6570\u3002",
  "settings.permission.title": "\u901A\u77E5\u6743\u9650",
  "settings.permission.granted": "\u5DF2\u6388\u6743",
  "settings.permission.denied": "\u5DF2\u62D2\u7EDD",
  "settings.permission.default": "\u672A\u6388\u6743",
  "settings.permission.request": "\u8BF7\u6C42\u6388\u6743",
  "settings.permission.test": "\u6D4B\u8BD5\u901A\u77E5",
  "settings.permission.deniedHint": "\u6D4F\u89C8\u5668\u5DF2\u963B\u6B62\u518D\u6B21\u5F39\u51FA\u6388\u6743\u6846\u3002\u8BF7\u5728\u5730\u5740\u680F\u5DE6\u4FA7\u7684\u7AD9\u70B9\u8BBE\u7F6E\u4E2D\u5141\u8BB8\u901A\u77E5\u3002",
  "settings.permission.defaultHint": "\u70B9\u51FB\u8BF7\u6C42\u6388\u6743\uFF0C\u5E76\u5728\u6D4F\u89C8\u5668\u63D0\u793A\u4E2D\u9009\u62E9\u5141\u8BB8\u3002",
  "settings.dingtalk.title": "\u9489\u9489\u673A\u5668\u4EBA",
  "settings.dingtalk.desc": "\u4EC5\u53D1\u9001\u5DF2\u5B8C\u5168\u6536\u655B\u7684\u9876\u5C42\u4EFB\u52A1\u7ED3\u679C\uFF1B\u5B50\u4EE3\u7406\u4E0D\u5355\u72EC\u53D1\u9001\u3002\u51ED\u636E\u4FDD\u5B58\u5728 DSH Host\u3002",
  "settings.dingtalk.docs": "\u521B\u5EFA\u673A\u5668\u4EBA\u6587\u6863",
  "settings.dingtalk.loading": "\u6B63\u5728\u8BFB\u53D6\u9489\u9489\u914D\u7F6E\u2026",
  "settings.dingtalk.configured": "\u5DF2\u914D\u7F6E",
  "settings.dingtalk.notConfigured": "\u672A\u914D\u7F6E",
  "settings.dingtalk.keepValue": "\u7559\u7A7A\u4EE5\u4FDD\u7559\u5DF2\u4FDD\u5B58\u503C",
  "settings.dingtalk.showSecret": "\u663E\u793A\u5BC6\u94A5",
  "settings.dingtalk.hideSecret": "\u9690\u85CF\u5BC6\u94A5",
  "settings.dingtalk.credentialsTogether": "Access Token \u548C Signing Secret \u5FC5\u987B\u540C\u65F6\u586B\u5199\u3002",
  "settings.dingtalk.outcomes": "\u53D1\u9001\u7684\u6D88\u606F",
  "settings.dingtalk.completed": "\u6210\u529F / \u5B8C\u6210",
  "settings.dingtalk.failed": "\u5931\u8D25 / \u4E2D\u6B62",
  "settings.dingtalk.failedDesc": "\u5305\u62EC\u9519\u8BEF\u3001\u963B\u585E\u548C\u4EE4\u724C\u9650\u5236\u3002",
  "settings.dingtalk.quiet": "\u542F\u7528\u6D88\u606F\u514D\u6253\u6270",
  "settings.dingtalk.quietDesc": "\u6309 Asia/Shanghai \u65F6\u533A\u5224\u65AD\uFF0C\u652F\u6301\u8DE8\u5348\u591C\u65F6\u6BB5\u3002",
  "settings.dingtalk.start": "\u5F00\u59CB",
  "settings.dingtalk.end": "\u7ED3\u675F",
  "settings.dingtalk.missed": "\u514D\u6253\u6270\u7ED3\u675F\u540E\u6C47\u603B\u901A\u77E5\u9519\u8FC7\u7684\u6D88\u606F",
  "settings.dingtalk.save": "\u4FDD\u5B58\u914D\u7F6E",
  "settings.dingtalk.saving": "\u4FDD\u5B58\u4E2D\u2026",
  "settings.dingtalk.test": "\u53D1\u9001\u6D4B\u8BD5",
  "settings.dingtalk.testing": "\u53D1\u9001\u4E2D\u2026",
  "settings.dingtalk.clear": "\u6E05\u9664\u51ED\u636E",
  "settings.dingtalk.clearing": "\u6E05\u9664\u4E2D\u2026",
  "settings.dingtalk.saved": "\u9489\u9489\u914D\u7F6E\u5DF2\u4FDD\u5B58\u3002",
  "settings.dingtalk.cleared": "\u9489\u9489\u51ED\u636E\u5DF2\u6E05\u9664\u3002",
  "settings.dingtalk.testSent": "\u6D4B\u8BD5\u6D88\u606F\u5DF2\u53D1\u9001\u3002",
  "settings.titleSurface.title": "\u6D4F\u89C8\u5668\u6807\u7B7E\u6807\u9898",
  "settings.titleSurface.enabled": "\u663E\u793A\u672A\u8BFB\u7ED3\u679C\u805A\u5408",
  "settings.titleSurface.running": "\u4EFB\u52A1\u8FD0\u884C\u65F6\u663E\u793A\u8F6C\u5708\u548C\u8FD0\u884C\u4E2D\u6570\u91CF",
  "settings.titleSurface.idleAnimation": "\u5207\u6362\u5230\u5176\u4ED6\u6807\u7B7E\u9875\u65F6\u6EDA\u52A8\u7A7A\u95F2\u4F1A\u8BDD\u6807\u9898",
  "settings.titleSurface.idleAnimationDesc": "\u5168\u5C40\u7A7A\u95F2\u65F6\u663E\u793A\u6700\u8FD1\u5DE5\u4F5C\u533A\u4F1A\u8BDD\u6807\u9898\uFF1B\u5173\u95ED\u540E\u6807\u9898\u4FDD\u6301\u9759\u6B62\u3002",
  "settings.titleSurface.idleFavicon": "\u7A7A\u95F2\u65F6\u4F7F\u7528\u84DD\u8272\u7F51\u9875\u56FE\u6807",
  "settings.titleSurface.idleFaviconDesc": "\u4EC5\u5207\u6362\u5230\u5176\u4ED6\u6807\u7B7E\u9875\u4E14\u5168\u5C40\u7A7A\u95F2\u65F6\u542F\u7528\uFF0C\u8FD4\u56DE\u9875\u9762\u540E\u6062\u590D\u3002",
  "settings.titleSurface.animation": "\u6807\u9898\u63D0\u9192\u52A8\u753B",
  "settings.titleSurface.marquee": "\u8DD1\u9A6C\u706F",
  "settings.titleSurface.blink": "\u95EA\u70C1",
  "settings.sidebar.title": "\u4FA7\u680F\u4F1A\u8BDD\u6807\u8BB0",
  "settings.sidebar.enabled": "\u663E\u793A\u6CE2\u7EB9\u72B6\u6001\u5706\u70B9",
  "settings.sidebar.desc": "\u6B63\u5E38\u5B8C\u6210\u4E3A\u7EFF\u8272\uFF0C\u9519\u8BEF\u3001\u4E2D\u6B62\u3001\u963B\u585E\u548C\u4EE4\u724C\u9650\u5236\u4E3A\u7EA2\u8272\uFF1B\u6253\u5F00\u4F1A\u8BDD\u540E\u6E05\u9664\u3002",
  "settings.outcomes.title": "\u901A\u77E5\u7ED3\u679C",
  "settings.outcomes.completed": "\u5B8C\u6210",
  "settings.outcomes.error": "\u9519\u8BEF",
  "settings.outcomes.aborted": "\u4E2D\u6B62",
  "settings.outcomes.blocked": "\u963B\u585E",
  "settings.outcomes.maxTokens": "\u4EE4\u724C\u9650\u5236",
  "notify.completed": "DSH \u4EFB\u52A1\u5DF2\u5B8C\u6210",
  "notify.error": "DSH \u4EFB\u52A1\u5931\u8D25",
  "notify.aborted": "DSH \u4EFB\u52A1\u5DF2\u4E2D\u6B62",
  "notify.blocked": "DSH \u4EFB\u52A1\u88AB\u963B\u585E",
  "notify.maxTokens": "DSH \u4EFB\u52A1\u8FBE\u5230\u4EE4\u724C\u9650\u5236",
  "notify.bodyFallback": "\u4EFB\u52A1\u5DF2\u7ED3\u675F",
  "notify.testTitle": "DSH \u901A\u77E5\u6D4B\u8BD5",
  "notify.testBody": "\u7CFB\u7EDF\u901A\u77E5\u5DE5\u4F5C\u6B63\u5E38\u3002",
  "title.running": "{n} \u4E2A\u4F1A\u8BDD\u8FDB\u884C\u4E2D",
  "title.completed": "{n} \u4E2A\u4F1A\u8BDD\u5DF2\u5B8C\u6210",
  "title.error": "{n} \u4E2A\u4F1A\u8BDD\u9519\u8BEF",
  "title.aborted": "{n} \u4E2A\u4F1A\u8BDD\u5DF2\u4E2D\u6B62",
  "title.blocked": "{n} \u4E2A\u4F1A\u8BDD\u963B\u585E",
  "title.maxTokens": "{n} \u4E2A\u4F1A\u8BDD\u8FBE\u5230\u4EE4\u724C\u9650\u5236"
};
var en = {
  nav: "Notifications",
  "settings.title": "Notifications and task status",
  "settings.subtitle": "Surface results only after a top-level task fully settles; subagents and background-launch turns do not notify separately.",
  "settings.enabled": "Enable notifications",
  "settings.enabledDesc": "Turn off every notification and status marker provided by dsh-notify.",
  "settings.system.title": "System notifications",
  "settings.system.enabled": "Show system notifications",
  "settings.system.backgroundOnly": "Only pop up when the task is out of view",
  "settings.system.maxBodyChars": "Maximum notification body characters",
  "settings.system.maxBodyCharsDesc": "Set 100\u20132000; defaults to 400. Longer text is truncated with an ellipsis.",
  "settings.system.maxBodyCharsError": "Enter an integer from 100 to 2000.",
  "settings.permission.title": "Notification permission",
  "settings.permission.granted": "Granted",
  "settings.permission.denied": "Denied",
  "settings.permission.default": "Not granted",
  "settings.permission.request": "Request permission",
  "settings.permission.test": "Test notification",
  "settings.permission.deniedHint": "The browser will not prompt again. Allow notifications in this site address-bar settings.",
  "settings.permission.defaultHint": "Request permission, then choose Allow in the browser prompt.",
  "settings.dingtalk.title": "DingTalk robot",
  "settings.dingtalk.desc": "Send selected outcomes only after a top-level task fully settles; subagents do not send separately. Credentials stay on the DSH host.",
  "settings.dingtalk.docs": "Robot setup docs",
  "settings.dingtalk.loading": "Loading DingTalk settings\u2026",
  "settings.dingtalk.configured": "Configured",
  "settings.dingtalk.notConfigured": "Not configured",
  "settings.dingtalk.keepValue": "Leave blank to keep the saved value",
  "settings.dingtalk.showSecret": "Show secret",
  "settings.dingtalk.hideSecret": "Hide secret",
  "settings.dingtalk.credentialsTogether": "Access Token and Signing Secret must be entered together.",
  "settings.dingtalk.outcomes": "Messages to send",
  "settings.dingtalk.completed": "Success / completed",
  "settings.dingtalk.failed": "Failed / aborted",
  "settings.dingtalk.failedDesc": "Includes errors, blocks, and token limits.",
  "settings.dingtalk.quiet": "Enable do not disturb",
  "settings.dingtalk.quietDesc": "Uses the Asia/Shanghai time zone and supports overnight ranges.",
  "settings.dingtalk.start": "Start",
  "settings.dingtalk.end": "End",
  "settings.dingtalk.missed": "Send one summary of missed messages when do not disturb ends",
  "settings.dingtalk.save": "Save settings",
  "settings.dingtalk.saving": "Saving\u2026",
  "settings.dingtalk.test": "Send test",
  "settings.dingtalk.testing": "Sending\u2026",
  "settings.dingtalk.clear": "Clear credentials",
  "settings.dingtalk.clearing": "Clearing\u2026",
  "settings.dingtalk.saved": "DingTalk settings saved.",
  "settings.dingtalk.cleared": "DingTalk credentials cleared.",
  "settings.dingtalk.testSent": "Test message sent.",
  "settings.titleSurface.title": "Browser tab title",
  "settings.titleSurface.enabled": "Show aggregated unread results",
  "settings.titleSurface.running": "Show a spinner and running-session count while tasks run",
  "settings.titleSurface.idleAnimation": "Scroll the idle session title after switching tabs",
  "settings.titleSurface.idleAnimationDesc": "Shows the most recent workspace session when globally idle; disabling this keeps the title still.",
  "settings.titleSurface.idleFavicon": "Use a blue favicon while idle",
  "settings.titleSurface.idleFaviconDesc": "Only applies when globally idle in another tab, and restores on return.",
  "settings.titleSurface.animation": "Title attention animation",
  "settings.titleSurface.marquee": "Marquee",
  "settings.titleSurface.blink": "Blink",
  "settings.sidebar.title": "Sidebar session markers",
  "settings.sidebar.enabled": "Show pulsing status dots",
  "settings.sidebar.desc": "Green for completion; red for errors, aborts, blocks, and token limits. Opening the session clears it.",
  "settings.outcomes.title": "Notification outcomes",
  "settings.outcomes.completed": "Completed",
  "settings.outcomes.error": "Error",
  "settings.outcomes.aborted": "Aborted",
  "settings.outcomes.blocked": "Blocked",
  "settings.outcomes.maxTokens": "Token limit",
  "notify.completed": "DSH task completed",
  "notify.error": "DSH task failed",
  "notify.aborted": "DSH task aborted",
  "notify.blocked": "DSH task blocked",
  "notify.maxTokens": "DSH task hit the token limit",
  "notify.bodyFallback": "The task ended",
  "notify.testTitle": "DSH notification test",
  "notify.testBody": "System notifications are working.",
  "title.running": "{n} sessions running",
  "title.completed": "{n} sessions completed",
  "title.error": "{n} sessions failed",
  "title.aborted": "{n} sessions aborted",
  "title.blocked": "{n} sessions blocked",
  "title.maxTokens": "{n} sessions hit the token limit"
};
var NS = "dsh-notify";

// src/client/runner.ts
var CONVERGENCE_WINDOW_MS = 250;
function seedCompletionState(snapshot) {
  const observed = {};
  const published = {};
  for (const id of snapshot.ids) {
    const turn = snapshot.byId[id]?.projectionValues?.dshNotify?.turn ?? 0;
    observed[id] = turn;
    published[id] = turn;
  }
  return { observed, pending: {}, published, settling: {} };
}
function belongsToTask(snapshot, sessionId, rootId) {
  if (sessionId === rootId) return true;
  let current = snapshot.byId[sessionId];
  const visited = /* @__PURE__ */ new Set();
  while (current?.origin === "subagent" && current.parentId !== void 0 && !visited.has(current.id)) {
    visited.add(current.id);
    if (current.parentId === rootId) return true;
    current = snapshot.byId[current.parentId];
  }
  return false;
}
function hasLiveJobs(snapshot, sessionId) {
  return snapshot.ids.some(
    (id) => belongsToTask(snapshot, id, sessionId) && (snapshot.jobsBySession[id] ?? []).some((job) => job.status === "running" || job.status === "stopping")
  );
}
function hasRunningSubagentDescendant(snapshot, ancestorId) {
  for (const id of snapshot.ids) {
    const initial = snapshot.byId[id];
    if (initial?.origin !== "subagent" || initial.running !== true) continue;
    if (belongsToTask(snapshot, id, ancestorId)) return true;
  }
  return false;
}
function removeMissing(record, live) {
  for (const id of Object.keys(record)) {
    if (!live.has(id)) delete record[id];
  }
}
function advanceCompletionState(previous, snapshot, now) {
  const observed = { ...previous.observed };
  const pending = { ...previous.pending };
  const publishedTurns = { ...previous.published };
  const settling = { ...previous.settling };
  const published = [];
  for (const id of snapshot.ids) {
    const summary = snapshot.byId[id];
    if (summary === void 0) continue;
    const projection = summary.projectionValues?.dshNotify;
    const priorObserved = observed[id];
    if (priorObserved === void 0) {
      const baseline = projection?.turn ?? 0;
      observed[id] = baseline;
      publishedTurns[id] = baseline;
      delete pending[id];
      delete settling[id];
      continue;
    }
    if (projection !== void 0 && projection.turn > priorObserved) {
      observed[id] = projection.turn;
      delete settling[id];
      const reason = asReason(projection.reason);
      if (summary.origin === "subagent" || reason === void 0) {
        publishedTurns[id] = projection.turn;
        delete pending[id];
      } else {
        pending[id] = {
          sessionId: id,
          turn: projection.turn,
          reason,
          title: summary.displayTitle,
          body: projection.body,
          startedAsyncDelegation: projection.startedAsyncDelegation === true
        };
      }
    }
    const candidate = pending[id];
    if (candidate === void 0) {
      delete settling[id];
      continue;
    }
    if (summary.origin === "subagent" || candidate.turn <= (publishedTurns[id] ?? 0)) {
      delete pending[id];
      delete settling[id];
      continue;
    }
    if (candidate.title !== summary.displayTitle) {
      pending[id] = { ...candidate, title: summary.displayTitle };
    }
    const currentCandidate = pending[id];
    const activeGoal = summary.projectionValues?.goal?.goal?.phase === "active";
    const eligible = summary.running !== true && !activeGoal && !currentCandidate.startedAsyncDelegation && !hasLiveJobs(snapshot, id) && !hasRunningSubagentDescendant(snapshot, id);
    if (!eligible) {
      delete settling[id];
      continue;
    }
    const window2 = settling[id];
    if (window2 === void 0 || window2.turn !== currentCandidate.turn) {
      settling[id] = {
        turn: currentCandidate.turn,
        readyAt: now + CONVERGENCE_WINDOW_MS
      };
      continue;
    }
    if (now < window2.readyAt) continue;
    publishedTurns[id] = currentCandidate.turn;
    delete pending[id];
    delete settling[id];
    published.push({
      sessionId: currentCandidate.sessionId,
      turn: currentCandidate.turn,
      reason: currentCandidate.reason,
      tone: toneOf(currentCandidate.reason),
      title: currentCandidate.title,
      body: currentCandidate.body,
      createdAt: now
    });
  }
  if (snapshot.phase === "ready") {
    const live = new Set(snapshot.ids);
    removeMissing(observed, live);
    removeMissing(pending, live);
    removeMissing(publishedTurns, live);
    removeMissing(settling, live);
  }
  let nextCheckAt;
  for (const window2 of Object.values(settling)) {
    if (nextCheckAt === void 0 || window2.readyAt < nextCheckAt) nextCheckAt = window2.readyAt;
  }
  return {
    state: {
      observed,
      pending,
      published: publishedTurns,
      settling
    },
    published,
    ...nextCheckAt === void 0 ? {} : { nextCheckAt }
  };
}
var CompletionRunner = class {
  state;
  snapshot;
  publish;
  now;
  setTimer;
  clearTimer;
  timer;
  disposed = false;
  constructor(snapshot, options) {
    this.snapshot = snapshot;
    this.state = seedCompletionState(snapshot);
    this.publish = options.publish;
    this.now = options.now ?? Date.now;
    this.setTimer = options.setTimer ?? setTimeout;
    this.clearTimer = options.clearTimer ?? clearTimeout;
  }
  update(snapshot) {
    if (this.disposed) return;
    this.snapshot = snapshot;
    this.evaluate();
  }
  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    this.cancelTimer();
  }
  evaluate() {
    this.cancelTimer();
    const now = this.now();
    const result = advanceCompletionState(this.state, this.snapshot, now);
    this.state = result.state;
    for (const entry of result.published) this.publish(entry);
    if (result.nextCheckAt === void 0 || this.disposed) return;
    this.timer = this.setTimer(() => {
      this.timer = void 0;
      if (!this.disposed) this.evaluate();
    }, Math.max(0, result.nextCheckAt - now));
  }
  cancelTimer() {
    if (this.timer === void 0) return;
    this.clearTimer(this.timer);
    this.timer = void 0;
  }
};

// src/client/sidebar.ts
var INDICATOR_ATTR = "data-dsh-notify-indicator";
var HOST_CLASS = "dsh_notify_indicatorHost";
function leafWithText(row, title) {
  return [...row.querySelectorAll("span")].find(
    (element) => element.children.length === 0 && element.textContent?.trim() === title
  );
}
function isStatusSlot(element) {
  return [...element.classList].some((name) => /(?:^|[-_])slot(?:[-_]|$)/iu.test(name));
}
function removeIndicators(root) {
  for (const marker of root.querySelectorAll(`[${INDICATOR_ATTR}]`)) {
    const host = marker.parentElement;
    marker.remove();
    if (host?.classList.contains(HOST_CLASS) === true) {
      host.classList.remove(HOST_CLASS);
      if (host.getAttribute("data-dsh-notify-created-host") === "true") host.remove();
      else host.removeAttribute("data-dsh-notify-created-host");
    }
  }
}
var SidebarIndicators = class {
  constructor(root = document) {
    this.root = root;
  }
  root;
  entries = [];
  enabled = true;
  observer;
  frame;
  rendering = false;
  warnedTitles = /* @__PURE__ */ new Set();
  start() {
    if (this.observer !== void 0 || this.root.body === null) return;
    this.observer = new MutationObserver(() => {
      if (!this.rendering) this.scheduleRender();
    });
    this.observer.observe(this.root.body, { childList: true, subtree: true });
    this.renderNow();
  }
  render(entries, enabled) {
    this.entries = entries;
    this.enabled = enabled;
    this.scheduleRender();
  }
  dispose() {
    this.observer?.disconnect();
    this.observer = void 0;
    if (this.frame !== void 0) cancelAnimationFrame(this.frame);
    this.frame = void 0;
    removeIndicators(this.root);
  }
  scheduleRender() {
    if (this.frame !== void 0) return;
    this.frame = requestAnimationFrame(() => {
      this.frame = void 0;
      this.renderNow();
    });
  }
  renderNow() {
    this.rendering = true;
    this.observer?.disconnect();
    removeIndicators(this.root);
    if (this.enabled) this.mountIndicators();
    if (this.observer !== void 0 && this.root.body !== null) {
      this.observer.observe(this.root.body, { childList: true, subtree: true });
    }
    this.rendering = false;
  }
  mountIndicators() {
    const byTitle = /* @__PURE__ */ new Map();
    for (const entry of this.entries) {
      const group = byTitle.get(entry.title) ?? [];
      group.push(entry);
      byTitle.set(entry.title, group);
    }
    const rows = [...this.root.querySelectorAll('[role="treeitem"][aria-selected]')];
    for (const [title, entries] of byTitle) {
      if (entries.length !== 1) {
        if (!this.warnedTitles.has(title)) {
          console.warn(`[dsh-notify] sidebar indicator skipped for duplicate session title: ${title}`);
          this.warnedTitles.add(title);
        }
        continue;
      }
      const entry = entries[0];
      if (entry === void 0) continue;
      const matches = rows.flatMap((row) => {
        const titleElement2 = leafWithText(row, title);
        return titleElement2 === void 0 ? [] : [titleElement2];
      });
      if (matches.length !== 1) {
        if (matches.length > 1 && !this.warnedTitles.has(title)) {
          console.warn(`[dsh-notify] sidebar indicator skipped for duplicate visible session title: ${title}`);
          this.warnedTitles.add(title);
        }
        continue;
      }
      const titleElement = matches[0];
      if (titleElement === void 0) continue;
      const host = titleElement.previousElementSibling;
      if (host === null || host.tagName !== "SPAN" || !isStatusSlot(host)) continue;
      const nativeState = host.querySelector("[data-state]")?.getAttribute("data-state");
      if (nativeState === "ongoing" || nativeState === "warning") continue;
      host.classList.add(HOST_CLASS);
      const marker = this.root.createElement("span");
      marker.setAttribute(INDICATOR_ATTR, "");
      marker.setAttribute("data-tone", entry.tone);
      marker.setAttribute("aria-hidden", "true");
      marker.title = entry.reason;
      host.appendChild(marker);
    }
  }
};

// src/client/settings-nav.ts
var HOST_ATTR = "data-dsh-notify-nav-bell-host";
var BELL_ATTR = "data-dsh-notify-nav-bell";
function navButton(root, label) {
  return [...root.querySelectorAll('[role="dialog"] button')].find((button) => button.textContent?.trim() === label);
}
function bellSvg(root) {
  const bell = root.createElementNS("http://www.w3.org/2000/svg", "svg");
  bell.setAttribute(BELL_ATTR, "");
  bell.setAttribute("viewBox", "0 0 24 24");
  bell.setAttribute("fill", "none");
  bell.setAttribute("aria-hidden", "true");
  bell.setAttribute("focusable", "false");
  const body = root.createElementNS("http://www.w3.org/2000/svg", "path");
  body.setAttribute("d", "M18 8A6 6 0 0 0 6 8c0 7-3 7-3 9h18c0-2-3-2-3-9Z");
  body.setAttribute("stroke", "currentColor");
  body.setAttribute("stroke-width", "1.8");
  body.setAttribute("stroke-linecap", "round");
  body.setAttribute("stroke-linejoin", "round");
  const clapper = root.createElementNS("http://www.w3.org/2000/svg", "path");
  clapper.setAttribute("d", "M10 21h4");
  clapper.setAttribute("stroke", "currentColor");
  clapper.setAttribute("stroke-width", "1.8");
  clapper.setAttribute("stroke-linecap", "round");
  bell.append(body, clapper);
  return bell;
}
function clear(root) {
  for (const button of root.querySelectorAll(`[${HOST_ATTR}]`)) {
    button.querySelector(`svg[${BELL_ATTR}]`)?.remove();
    button.removeAttribute(HOST_ATTR);
  }
}
var SettingsNavBell = class {
  constructor(root = document, label) {
    this.root = root;
    this.label = label;
  }
  root;
  label;
  observer;
  start() {
    if (this.observer !== void 0 || this.root.body === null) return;
    this.observer = new MutationObserver(() => {
      this.sync();
    });
    this.sync();
  }
  dispose() {
    this.observer?.disconnect();
    this.observer = void 0;
    clear(this.root);
  }
  sync() {
    this.observer?.disconnect();
    clear(this.root);
    const button = navButton(this.root, this.label());
    if (button !== void 0) {
      const defaultIcon = [...button.children].find((child) => child.localName === "svg");
      if (defaultIcon !== void 0) {
        button.setAttribute(HOST_ATTR, "");
        defaultIcon.before(bellSvg(this.root));
      }
    }
    if (this.observer !== void 0 && this.root.body !== null) {
      this.observer.observe(this.root.body, { childList: true, subtree: true, characterData: true });
    }
  }
};

// src/client/store.ts
var import_client = require("@deepseek-ai/dsh-client-runtime/client");
var SETTINGS_KEY = "dsh-notify.v1";
function persistedSettings() {
  const defaults = defaultNotificationSettings();
  if (typeof localStorage === "undefined") return defaults;
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    const settings = normalizeNotificationSettings(raw === null ? defaults : JSON.parse(raw));
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    return settings;
  } catch {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(defaults));
    } catch {
    }
    return defaults;
  }
}
function createNotificationSettingsStore() {
  const normalized = persistedSettings();
  const store = (0, import_client.createSnapshotStore)(defaultNotificationSettings(), { persist: { name: SETTINGS_KEY } });
  store.set(normalized);
  return store;
}
function createAttentionStore() {
  const store = (0, import_client.createSnapshotStore)({ bySession: {} });
  return Object.assign(store, {
    put(entry) {
      const current = store.getSnapshot();
      store.update((draft) => {
        Object.assign(draft, putAttention(current, entry));
      });
    },
    clear(sessionId) {
      const current = store.getSnapshot();
      const next = clearAttention(current, sessionId);
      if (next === current) return;
      store.update((draft) => {
        Object.assign(draft, next);
      });
    },
    retain(sessionIds) {
      const current = store.getSnapshot();
      const next = retainAttention(current, sessionIds);
      if (next === current) return;
      store.update((draft) => {
        Object.assign(draft, next);
      });
    },
    filter(settings) {
      const current = store.getSnapshot();
      const next = filterAttentionBySettings(current, settings);
      if (next === current) return;
      store.update((draft) => {
        Object.assign(draft, next);
      });
    }
  });
}

// src/client/styles.ts
var STYLE_ID = "dsh-notify-style";
var cssText = `
.dsh_notify_settings { display:flex; flex-direction:column; gap:14px; min-width:0; }
.dsh_notify_settings header h2 { margin:0; color:var(--dsw-alias-label-primary); font-size:18px; line-height:26px; }
.dsh_notify_settings header p, .dsh_notify_hint { margin:2px 0 0; color:var(--dsw-alias-label-tertiary); font-size:13px; line-height:20px; }
.dsh_notify_group { display:flex; flex-direction:column; gap:10px; padding:14px 0; border-bottom:1px solid var(--dsw-alias-border-l2); }
.dsh_notify_group h3 { margin:0; color:var(--dsw-alias-label-primary); font-size:14px; line-height:22px; }
.dsh_notify_toggle { display:flex; align-items:flex-start; gap:10px; cursor:pointer; color:var(--dsw-alias-label-primary); }
.dsh_notify_toggle input { width:16px; height:16px; margin:3px 0 0; accent-color:var(--dsw-alias-brand-primary); }
.dsh_notify_toggle span { display:flex; flex-direction:column; min-width:0; font-size:14px; line-height:22px; }
.dsh_notify_toggle strong { font-weight:400; }
.dsh_notify_toggle small { color:var(--dsw-alias-label-tertiary); font-size:13px; line-height:19px; }
.dsh_notify_numberField { display:flex; flex-direction:column; align-items:flex-start; gap:5px; color:var(--dsw-alias-label-secondary); font-size:13px; }
.dsh_notify_numberField input { box-sizing:border-box; width:140px; height:34px; padding:0 10px; border:1px solid var(--dsw-alias-border-l2); border-radius:6px; outline:none; background:var(--dsw-alias-bg-layer-1); color:var(--dsw-alias-label-primary); font:inherit; }
.dsh_notify_numberField input:focus { border-color:var(--dsw-alias-brand-primary); }
.dsh_notify_numberField input[aria-invalid='true'] { border-color:var(--dsw-alias-state-error-primary); }
.dsh_notify_numberField small { color:var(--dsw-alias-label-tertiary); font-size:12px; line-height:18px; }
.dsh_notify_numberField small[data-error='true'] { color:var(--dsw-alias-state-error-primary); }
.dsh_notify_permission { display:flex; align-items:center; flex-wrap:wrap; gap:8px; color:var(--dsw-alias-label-secondary); font-size:13px; }
.dsh_notify_permission b[data-permission='granted'] { color:var(--dsw-alias-state-success-primary); }
.dsh_notify_permission b[data-permission='denied'] { color:var(--dsw-alias-state-error-primary); }
.dsh_notify_permission button, .dsh_notify_segment button { height:30px; padding:0 12px; border:1px solid var(--dsw-alias-border-l2); border-radius:6px; background:var(--dsw-alias-bg-layer-1); color:var(--dsw-alias-label-primary); cursor:pointer; }
.dsh_notify_permission button:hover, .dsh_notify_segment button:hover { background:var(--dsw-alias-interactive-bg-hover); }
.dsh_notify_segment { display:inline-flex; align-self:flex-start; gap:4px; }
.dsh_notify_segment button[aria-pressed='true'] { border-color:var(--dsw-alias-brand-primary); background:var(--dsw-alias-interactive-bg-hover); }
.dsh_notify_outcomes { display:flex; flex-wrap:wrap; gap:10px 22px; }
.dsh_notify_toggle[data-disabled='true'] { cursor:not-allowed; opacity:.55; }
.dsh_notify_groupHeading { display:flex; align-items:flex-start; justify-content:space-between; gap:12px; }
.dsh_notify_groupHeading > div { min-width:0; }
.dsh_notify_groupHeading > .dsh_notify_button { flex:none; white-space:nowrap; }
.dsh_notify_groupHeading p { margin:2px 0 0; color:var(--dsw-alias-label-tertiary); font-size:13px; line-height:19px; }
.dsh_notify_statusLine { display:flex; align-items:center; gap:8px; color:var(--dsw-alias-label-secondary); font-size:13px; }
.dsh_notify_statusLine > span { width:8px; height:8px; border-radius:50%; background:var(--dsw-alias-label-tertiary); }
.dsh_notify_statusLine[data-configured='true'] > span { background:var(--dsw-alias-state-success-primary); }
.dsh_notify_fields { display:grid; grid-template-columns:minmax(0,1fr) minmax(0,1fr); gap:10px; }
.dsh_notify_fields label, .dsh_notify_timeRange label { display:flex; flex-direction:column; gap:5px; min-width:0; color:var(--dsw-alias-label-secondary); font-size:12px; }
.dsh_notify_fields input, .dsh_notify_timeRange input { box-sizing:border-box; width:100%; height:34px; min-width:0; padding:0 10px; border:1px solid var(--dsw-alias-border-l2); border-radius:6px; outline:none; background:var(--dsw-alias-bg-layer-1); color:var(--dsw-alias-label-primary); font:inherit; }
.dsh_notify_fields input:focus, .dsh_notify_timeRange input:focus { border-color:var(--dsw-alias-brand-primary); }
.dsh_notify_secretInput { position:relative; display:block; min-width:0; }
.dsh_notify_secretInput input { padding-right:38px; }
.dsh_notify_secretInput button { position:absolute; top:1px; right:1px; display:flex; align-items:center; justify-content:center; width:32px; height:32px; padding:0; border:0; border-radius:5px; background:transparent; color:var(--dsw-alias-label-secondary); cursor:pointer; font-size:16px; line-height:1; }
.dsh_notify_secretInput button:hover { background:var(--dsw-alias-interactive-bg-hover); color:var(--dsw-alias-label-primary); }
.dsh_notify_secretInput button:focus-visible { outline:2px solid var(--dsw-alias-brand-primary); outline-offset:-2px; }
.dsh_notify_eyeIcon { display:block; width:18px; height:18px; fill:currentColor; }
.dsh_notify_subgroup { display:flex; flex-direction:column; gap:9px; padding-top:2px; }
.dsh_notify_subgroup > strong { color:var(--dsw-alias-label-secondary); font-size:12px; font-weight:500; }
.dsh_notify_timeRange { display:grid; grid-template-columns:minmax(0,150px) 12px minmax(0,150px); align-items:end; gap:8px; }
.dsh_notify_timeRange > span { padding-bottom:8px; color:var(--dsw-alias-label-tertiary); text-align:center; }
.dsh_notify_timeRange[data-disabled='true'] { opacity:.55; }
.dsh_notify_actions { display:flex; flex-wrap:wrap; gap:8px; }
.dsh_notify_button { min-height:32px; padding:0 12px; border:1px solid var(--dsw-alias-border-l2); border-radius:6px; background:var(--dsw-alias-bg-layer-1); color:var(--dsw-alias-label-primary); cursor:pointer; }
.dsh_notify_button:hover:not(:disabled) { background:var(--dsw-alias-interactive-bg-hover); }
.dsh_notify_button:disabled { cursor:not-allowed; opacity:.5; }
.dsh_notify_buttonPrimary { border-color:var(--dsw-alias-brand-primary); background:var(--dsw-alias-brand-primary); color:white; }
.dsh_notify_buttonDanger { color:var(--dsw-alias-state-error-primary); }
.dsh_notify_feedback { margin:0; font-size:13px; line-height:19px; color:var(--dsw-alias-state-success-primary); }
.dsh_notify_feedback[data-tone='error'] { color:var(--dsw-alias-state-error-primary); }
@media (max-width:600px) { .dsh_notify_groupHeading { flex-direction:column; } .dsh_notify_fields { grid-template-columns:1fr; } .dsh_notify_timeRange { grid-template-columns:minmax(0,1fr) 12px minmax(0,1fr); } }
[data-dsh-notify-nav-bell-host] > svg:not([data-dsh-notify-nav-bell]) { display:none; }
[data-dsh-notify-nav-bell] { width:16px; height:16px; flex:none; }
.dsh_notify_indicatorHost { display:inline-flex !important; align-items:center; justify-content:center; flex:none; width:16px; height:20px; }
.dsh_notify_indicatorHost > [data-state] { display:none !important; }
[data-dsh-notify-indicator] { position:relative; display:inline-block; width:10px; height:10px; color:var(--dsw-alias-state-success-primary); }
[data-dsh-notify-indicator][data-tone='error'] { color:var(--dsw-alias-state-error-primary); }
[data-dsh-notify-indicator]::before, [data-dsh-notify-indicator]::after { content:''; position:absolute; border-radius:50%; background:currentColor; }
[data-dsh-notify-indicator]::before { inset:2px; }
[data-dsh-notify-indicator]::after { inset:0; opacity:.18; animation:dsh-notify-pulse 1.5s ease-out infinite; }
@keyframes dsh-notify-pulse { 0% { transform:scale(.6); opacity:.32; } 70%,100% { transform:scale(1.7); opacity:0; } }
@media (prefers-reduced-motion: reduce) { [data-dsh-notify-indicator]::after { animation:none; } }
`;
function adoptStyles() {
  document.getElementById(STYLE_ID)?.remove();
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = cssText;
  document.head.appendChild(style);
  return () => {
    style.remove();
  };
}

// src/client/title.ts
function recentWorkspaceSessionTitle(ids, byId) {
  let recent;
  for (const id of ids) {
    const summary = byId[id];
    if (summary === void 0 || summary.cwd === void 0 || summary.origin === "subagent" || summary.blank) continue;
    if (recent === void 0 || summary.updatedAt > recent.updatedAt) recent = summary;
  }
  const value = recent?.title?.trim() || recent?.displayTitle.trim();
  return value === "" ? void 0 : value;
}
var REASON_ORDER = ["completed", "error", "aborted", "blocked", "max-tokens"];
var SPINNER_FRAMES = ["\u280B", "\u2819", "\u2839", "\u2838", "\u283C", "\u2834", "\u2826", "\u2827", "\u2807", "\u280F"];
function aggregatedTitle(entries, label, runningCount = 0, runningLabel = (count) => `${String(count)} running`) {
  const counts = /* @__PURE__ */ new Map();
  for (const entry of entries) counts.set(entry.reason, (counts.get(entry.reason) ?? 0) + 1);
  const parts = runningCount > 0 ? [runningLabel(runningCount)] : [];
  for (const reason of REASON_ORDER) {
    const count = counts.get(reason) ?? 0;
    if (count > 0) parts.push(label(reason, count));
  }
  return parts.length === 0 ? "" : `dsh (${parts.join(" \xB7 ")})`;
}
function productTitleOf(renderedTitle, currentSessionTitle) {
  if (currentSessionTitle === void 0) return renderedTitle;
  const prefix = `${currentSessionTitle} \u2014 `;
  return renderedTitle.startsWith(prefix) ? renderedTitle.slice(prefix.length) : renderedTitle;
}
function shellTitleOf(productTitle, currentSessionTitle) {
  return currentSessionTitle === void 0 ? productTitle : `${currentSessionTitle} \u2014 ${productTitle}`;
}
var MARQUEE_STEP_MS = 120;
var SPINNER_STEP_MS = 180;
var BLINK_STEP_MS = 900;
var TitleNotifier = class {
  constructor(target = document, schedule = (callback, ms) => window.setTimeout(callback, ms), cancel = (id) => {
    window.clearTimeout(id);
  }, requestFrame = (callback) => window.requestAnimationFrame(callback), cancelFrame = (id) => {
    window.cancelAnimationFrame(id);
  }, hidden = () => typeof document === "undefined" || document.hidden, now = () => performance.now()) {
    this.target = target;
    this.schedule = schedule;
    this.cancel = cancel;
    this.requestFrame = requestFrame;
    this.cancelFrame = cancelFrame;
    this.hidden = hidden;
    this.now = now;
    this.baseTitle = target.title;
  }
  target;
  schedule;
  cancel;
  requestFrame;
  cancelFrame;
  hidden;
  now;
  baseTitle;
  timer;
  animationFrame;
  text = "";
  mode = "marquee";
  spinning = false;
  animateText = true;
  offset = 0;
  frame = 0;
  lastStepAt = 0;
  scheduler;
  render(text, mode, spinning = false, animateText = true, baseTitle = this.baseTitle) {
    const baseChanged = this.baseTitle !== baseTitle;
    this.baseTitle = baseTitle;
    if (this.text === text && this.mode === mode && this.spinning === spinning && this.animateText === animateText) {
      if (text === "" && baseChanged) this.write(baseTitle);
      const expectedScheduler = this.hidden() ? "timer" : "frame";
      if ((spinning || animateText) && this.scheduler !== expectedScheduler) {
        this.stopAnimation();
        this.lastStepAt = this.now();
        this.scheduleNext();
      }
      return;
    }
    this.stopAnimation();
    this.text = text;
    this.mode = mode;
    this.spinning = spinning;
    this.animateText = animateText;
    this.offset = 0;
    this.frame = 0;
    this.lastStepAt = this.now();
    if (text === "") {
      this.write(baseTitle);
      return;
    }
    this.tick();
    if (spinning || animateText) this.scheduleNext();
  }
  dispose(restoreTitle = this.baseTitle) {
    this.stopAnimation();
    this.write(restoreTitle);
  }
  write(value) {
    if (this.target.title !== value) this.target.title = value;
  }
  stepDuration() {
    if (this.spinning) return SPINNER_STEP_MS;
    return this.mode === "marquee" ? MARQUEE_STEP_MS : BLINK_STEP_MS;
  }
  advance(timestamp) {
    const duration = this.stepDuration();
    if (timestamp - this.lastStepAt < duration) return;
    this.lastStepAt = timestamp;
    this.tick();
  }
  scheduleNext() {
    if (this.hidden()) {
      this.scheduler = "timer";
      this.timer = this.schedule(() => {
        this.timer = void 0;
        this.lastStepAt = this.now();
        this.tick();
        this.scheduleNext();
      }, this.stepDuration());
      return;
    }
    this.scheduler = "frame";
    this.animationFrame = this.requestFrame((timestamp) => {
      this.animationFrame = void 0;
      this.advance(timestamp);
      this.scheduleNext();
    });
  }
  tick() {
    const prefix = this.spinning ? `${SPINNER_FRAMES[this.frame % SPINNER_FRAMES.length]} ` : "";
    if (!this.animateText) {
      this.write(prefix + this.text);
    } else if (this.mode === "blink") {
      const phaseLength = this.spinning ? 5 : 1;
      const showAttention = Math.floor(this.frame / phaseLength) % 2 === 0;
      this.write(showAttention ? prefix + this.text : prefix + this.baseTitle);
    } else {
      const runway = `   ${this.text}`;
      const offset = this.offset % runway.length;
      this.write(prefix + runway.slice(offset) + runway.slice(0, offset));
      if (!this.spinning || this.frame % 2 === 1) this.offset = (offset + 1) % runway.length;
    }
    this.frame += 1;
  }
  stopAnimation() {
    if (this.timer !== void 0) {
      this.cancel(this.timer);
      this.timer = void 0;
    }
    if (this.animationFrame !== void 0) {
      this.cancelFrame(this.animationFrame);
      this.animationFrame = void 0;
    }
    this.scheduler = void 0;
  }
};

// src/client/index.ts
var inject = ["sessions", "slots", "locale"];
function titleKey(reason) {
  switch (reason) {
    case "completed":
      return "title.completed";
    case "error":
      return "title.error";
    case "aborted":
      return "title.aborted";
    case "blocked":
      return "title.blocked";
    case "max-tokens":
      return "title.maxTokens";
  }
}
function apply(ctx) {
  const disposeStyles = adoptStyles();
  ctx.effect(() => disposeStyles, "dsh-notify: styles");
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), "dsh-notify: dictionaries");
  const t = ctx.locale.bind(NS);
  const sessions = ctx.get("sessions");
  const settings = createNotificationSettingsStore();
  const attention = createAttentionStore();
  const initialList = sessions.list.getSnapshot();
  const initialSessionTitle = initialList.current === void 0 ? void 0 : initialList.byId[initialList.current]?.title;
  const productTitle = productTitleOf(document.title, initialSessionTitle);
  const title = new TitleNotifier();
  const favicon = new FaviconNotifier();
  const notifications = new NotificationRegistry();
  const sidebar = new SidebarIndicators();
  const settingsNavBell = new SettingsNavBell(document, () => t("nav"));
  sidebar.start();
  settingsNavBell.start();
  const set = (patch) => {
    settings.update((draft) => {
      Object.assign(draft, patch);
    });
    attention.filter(settings.getSnapshot());
  };
  const requestPermission = () => notificationsApi()?.requestPermission() ?? Promise.resolve("denied");
  const show = (entry) => {
    const api = notificationsApi();
    if (api === void 0) return;
    const notification = createNotification(api, t(notificationTitleKey(entry.reason)), {
      body: notificationBody(entry, t("notify.bodyFallback"), settings.getSnapshot().maxBodyChars),
      tag: `dsh-notify-${entry.sessionId}-${String(entry.turn)}`
    });
    if (notification === void 0) return;
    notifications.track(notification);
    notification.onclick = () => {
      window.focus();
      sessions.open(entry.sessionId);
      attention.clear(entry.sessionId);
      notification.close();
    };
  };
  const sendTest = () => {
    const api = notificationsApi();
    if (api === void 0 || api.permission !== "granted") return;
    const notification = createNotification(api, t("notify.testTitle"), {
      body: t("notify.testBody"),
      tag: `dsh-notify-test-${String(Date.now())}`
    });
    if (notification !== void 0) notifications.track(notification);
  };
  const visibleEntries = () => {
    const current = settings.getSnapshot();
    if (!current.enabled) return [];
    return attentionEntries(attention.getSnapshot()).filter((entry) => reasonEnabled(current, entry.reason));
  };
  const renderSurfaces = () => {
    const current = settings.getSnapshot();
    const state = sessions.list.getSnapshot();
    const entries = visibleEntries();
    const runningCount = current.enabled ? runningConversationCount(state.ids, state.byId) : 0;
    const titleRunningCount = current.runningTitleIndicator ? runningCount : 0;
    const titleEntries = current.titleNotifications ? entries : [];
    const titleText = aggregatedTitle(
      titleEntries,
      (reason, count) => t(titleKey(reason), { n: count }),
      titleRunningCount,
      (count) => t("title.running", { n: count })
    );
    const currentSessionTitle = state.current === void 0 ? void 0 : state.byId[state.current]?.title;
    const shellTitle = shellTitleOf(productTitle, currentSessionTitle);
    const idle = current.enabled && runningCount === 0 && entries.length === 0;
    const recentTitle = recentWorkspaceSessionTitle(state.ids, state.byId);
    const idleShellTitle = shellTitleOf(productTitle, recentTitle);
    const animateIdle = idle && document.hidden && current.idleTitleAnimation && recentTitle !== void 0;
    if (animateIdle) title.render(idleShellTitle, current.titleAnimation, false, true, productTitle);
    else title.render(titleText, current.titleAnimation, titleRunningCount > 0, titleEntries.length > 0, idle ? idleShellTitle : shellTitle);
    favicon.render(idle && document.hidden && current.idleFaviconIndicator);
    const sidebarEnabled = current.enabled && current.sidebarIndicators;
    document.documentElement.setAttribute("data-dsh-notify-sidebar", sidebarEnabled ? "on" : "off");
    sidebar.render(entries, sidebarEnabled);
  };
  ctx.effect(() => {
    const completion = new CompletionRunner(
      initialList,
      {
        publish(entry) {
          const currentSettings = settings.getSnapshot();
          if (!currentSettings.enabled || !reasonEnabled(currentSettings, entry.reason)) return;
          const state = sessions.list.getSnapshot();
          if (state.current !== entry.sessionId || document.hidden) attention.put(entry);
          const permission = notificationsApi()?.permission ?? "denied";
          if (shouldShowSystem(
            permission,
            currentSettings,
            document.hidden,
            entry.sessionId,
            state.current
          )) show(entry);
        }
      }
    );
    const update = () => {
      const state = sessions.list.getSnapshot();
      if (state.current !== void 0 && !document.hidden) attention.clear(state.current);
      completion.update(state);
      if (state.phase === "ready") {
        const live = new Set(state.ids);
        attention.retain(live);
      }
      renderSurfaces();
    };
    const stopList = sessions.list.subscribe(update);
    const onVisibility = () => {
      if (!document.hidden) {
        const current = sessions.list.getSnapshot().current;
        if (current !== void 0) attention.clear(current);
      }
      renderSurfaces();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      stopList();
      completion.dispose();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, "dsh-notify: session lifecycle");
  ctx.effect(() => {
    const stopAttention = attention.subscribe(renderSurfaces);
    const stopSettings = settings.subscribe(renderSurfaces);
    renderSurfaces();
    return () => {
      stopAttention();
      stopSettings();
      notifications.closeAll();
      sidebar.dispose();
      settingsNavBell.dispose();
      favicon.dispose();
      const state = sessions.list.getSnapshot();
      const currentSessionTitle = state.current === void 0 ? void 0 : state.byId[state.current]?.title;
      title.dispose(shellTitleOf(productTitle, currentSessionTitle));
      document.documentElement.removeAttribute("data-dsh-notify-sidebar");
    };
  }, "dsh-notify: surfaces");
  ctx.slots.inject("settings.section", () => ctx.slots.register({
    name: "settings.section",
    id: "dsh-notify",
    order: 60,
    label: () => t("nav"),
    locale: NS,
    inject: () => ({
      hooks: { settings },
      set,
      requestPermission,
      sendTest,
      loadDingTalk: loadDingTalkSettings,
      saveDingTalk: saveDingTalkSettings,
      testDingTalk: sendDingTalkTest
    })
  }, NotifySettingsSection));
}
return module.exports; } });
//# sourceMappingURL=client.js.map
