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
function notificationBody(entry, fallback) {
  const body = entry.body.trim() === "" ? fallback : entry.body.trim();
  return `${entry.title}: ${body}`;
}

// src/client/SettingsSection.tsx
var import_jsx_runtime = require("react/jsx-runtime");
function Toggle({ checked, label, desc, onChange }) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { className: "dsh_notify_toggle", children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { type: "checkbox", checked, onChange: (event) => {
      onChange(event.target.checked);
    } }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: label }),
      desc === void 0 ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: desc })
    ] })
  ] });
}
var OUTCOMES = [
  { field: "notifyCompleted", key: "settings.outcomes.completed" },
  { field: "notifyError", key: "settings.outcomes.error" },
  { field: "notifyAborted", key: "settings.outcomes.aborted" },
  { field: "notifyBlocked", key: "settings.outcomes.blocked" },
  { field: "notifyMaxTokens", key: "settings.outcomes.maxTokens" }
];
function NotifySettingsSection({ useSettings, set, requestPermission, sendTest, t }) {
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
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsh_notify_group", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { children: t("settings.titleSurface.title") }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toggle, { checked: settings.titleNotifications, label: t("settings.titleSurface.enabled"), onChange: (checked) => {
        change("titleNotifications", checked);
      } }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toggle, { checked: settings.runningTitleIndicator, label: t("settings.titleSurface.running"), onChange: (checked) => {
        change("runningTitleIndicator", checked);
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
  "settings.subtitle": "\u5728\u7CFB\u7EDF\u901A\u77E5\u3001\u6D4F\u89C8\u5668\u6807\u7B7E\u548C\u4F1A\u8BDD\u5217\u8868\u4E2D\u663E\u793A\u4EFB\u52A1\u72B6\u6001\u3002",
  "settings.enabled": "\u542F\u7528\u901A\u77E5",
  "settings.enabledDesc": "\u5173\u95ED\u6240\u6709\u7531 dsh-notify \u63D0\u4F9B\u7684\u901A\u77E5\u548C\u72B6\u6001\u6807\u8BB0\u3002",
  "settings.system.title": "\u7CFB\u7EDF\u901A\u77E5",
  "settings.system.enabled": "\u5F39\u51FA\u7CFB\u7EDF\u901A\u77E5",
  "settings.system.backgroundOnly": "\u4EC5\u5728\u4EFB\u52A1\u4E0D\u5728\u773C\u524D\u65F6\u5F39\u51FA",
  "settings.permission.title": "\u901A\u77E5\u6743\u9650",
  "settings.permission.granted": "\u5DF2\u6388\u6743",
  "settings.permission.denied": "\u5DF2\u62D2\u7EDD",
  "settings.permission.default": "\u672A\u6388\u6743",
  "settings.permission.request": "\u8BF7\u6C42\u6388\u6743",
  "settings.permission.test": "\u6D4B\u8BD5\u901A\u77E5",
  "settings.permission.deniedHint": "\u6D4F\u89C8\u5668\u5DF2\u963B\u6B62\u518D\u6B21\u5F39\u51FA\u6388\u6743\u6846\u3002\u8BF7\u5728\u5730\u5740\u680F\u5DE6\u4FA7\u7684\u7AD9\u70B9\u8BBE\u7F6E\u4E2D\u5141\u8BB8\u901A\u77E5\u3002",
  "settings.permission.defaultHint": "\u70B9\u51FB\u8BF7\u6C42\u6388\u6743\uFF0C\u5E76\u5728\u6D4F\u89C8\u5668\u63D0\u793A\u4E2D\u9009\u62E9\u5141\u8BB8\u3002",
  "settings.titleSurface.title": "\u6D4F\u89C8\u5668\u6807\u7B7E\u6807\u9898",
  "settings.titleSurface.enabled": "\u663E\u793A\u672A\u8BFB\u7ED3\u679C\u805A\u5408",
  "settings.titleSurface.running": "\u4EFB\u52A1\u8FD0\u884C\u65F6\u663E\u793A\u8F6C\u5708\u548C\u8FD0\u884C\u4E2D\u6570\u91CF",
  "settings.titleSurface.animation": "\u672A\u8BFB\u7ED3\u679C\u52A8\u753B",
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
  "notify.error": "DSH \u4EFB\u52A1\u51FA\u9519",
  "notify.aborted": "DSH \u4EFB\u52A1\u5DF2\u4E2D\u6B62",
  "notify.blocked": "DSH \u4EFB\u52A1\u88AB\u963B\u585E",
  "notify.maxTokens": "DSH \u8FBE\u5230\u4EE4\u724C\u9650\u5236",
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
  "settings.subtitle": "Surface task status through system notifications, browser tabs, and the session list.",
  "settings.enabled": "Enable notifications",
  "settings.enabledDesc": "Turn off every notification and status marker provided by dsh-notify.",
  "settings.system.title": "System notifications",
  "settings.system.enabled": "Show system notifications",
  "settings.system.backgroundOnly": "Only pop up when the task is out of view",
  "settings.permission.title": "Notification permission",
  "settings.permission.granted": "Granted",
  "settings.permission.denied": "Denied",
  "settings.permission.default": "Not granted",
  "settings.permission.request": "Request permission",
  "settings.permission.test": "Test notification",
  "settings.permission.deniedHint": "The browser will not prompt again. Allow notifications in this site address-bar settings.",
  "settings.permission.defaultHint": "Request permission, then choose Allow in the browser prompt.",
  "settings.titleSurface.title": "Browser tab title",
  "settings.titleSurface.enabled": "Show aggregated unread results",
  "settings.titleSurface.running": "Show a spinner and running-session count while tasks run",
  "settings.titleSurface.animation": "Unread-result animation",
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
  "notify.maxTokens": "DSH hit the token limit",
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
function projectionAdvance(previousTurn, projection) {
  const turn = projection?.turn ?? previousTurn ?? 0;
  return { turn, fresh: projection !== void 0 && previousTurn !== void 0 && turn > previousTurn };
}

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

// src/client/state.ts
function defaultNotificationSettings() {
  return {
    enabled: true,
    systemNotifications: true,
    titleNotifications: true,
    runningTitleIndicator: true,
    sidebarIndicators: true,
    titleAnimation: "marquee",
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
    sidebarIndicators: booleanOr(source.sidebarIndicators, defaults.sidebarIndicators),
    titleAnimation: animation,
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

// src/client/store.ts
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
.dsh_notify_permission { display:flex; align-items:center; flex-wrap:wrap; gap:8px; color:var(--dsw-alias-label-secondary); font-size:13px; }
.dsh_notify_permission b[data-permission='granted'] { color:var(--dsw-alias-state-success-primary); }
.dsh_notify_permission b[data-permission='denied'] { color:var(--dsw-alias-state-error-primary); }
.dsh_notify_permission button, .dsh_notify_segment button { height:30px; padding:0 12px; border:1px solid var(--dsw-alias-border-l2); border-radius:6px; background:var(--dsw-alias-bg-layer-1); color:var(--dsw-alias-label-primary); cursor:pointer; }
.dsh_notify_permission button:hover, .dsh_notify_segment button:hover { background:var(--dsw-alias-interactive-bg-hover); }
.dsh_notify_segment { display:inline-flex; align-self:flex-start; gap:4px; }
.dsh_notify_segment button[aria-pressed='true'] { border-color:var(--dsw-alias-brand-primary); background:var(--dsw-alias-interactive-bg-hover); }
.dsh_notify_outcomes { display:flex; flex-wrap:wrap; gap:10px 22px; }
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
var TitleNotifier = class {
  constructor(target = document, schedule = window.setInterval.bind(window), cancel = window.clearInterval.bind(window)) {
    this.target = target;
    this.schedule = schedule;
    this.cancel = cancel;
    this.baseTitle = target.title;
  }
  target;
  schedule;
  cancel;
  baseTitle;
  timer;
  text = "";
  mode = "marquee";
  spinning = false;
  animateText = true;
  offset = 0;
  frame = 0;
  render(text, mode, spinning = false, animateText = true, baseTitle = this.baseTitle) {
    const baseChanged = this.baseTitle !== baseTitle;
    this.baseTitle = baseTitle;
    if (this.text === text && this.mode === mode && this.spinning === spinning && this.animateText === animateText) {
      if (text === "" && baseChanged) this.write(baseTitle);
      return;
    }
    this.stopTimer();
    this.text = text;
    this.mode = mode;
    this.spinning = spinning;
    this.animateText = animateText;
    this.offset = 0;
    this.frame = 0;
    if (text === "") {
      this.write(baseTitle);
      return;
    }
    this.tick();
    this.timer = this.schedule(() => {
      this.tick();
    }, spinning ? 180 : mode === "marquee" ? 300 : 900);
  }
  dispose() {
    this.stopTimer();
    this.write(this.baseTitle);
  }
  write(value) {
    this.target.title = value;
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
  stopTimer() {
    if (this.timer === void 0) return;
    this.cancel(this.timer);
    this.timer = void 0;
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
      body: notificationBody(entry, t("notify.bodyFallback")),
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
    const runningCount = current.enabled && current.runningTitleIndicator ? runningConversationCount(state.ids, state.byId) : 0;
    const titleEntries = current.titleNotifications ? entries : [];
    const titleText = aggregatedTitle(
      titleEntries,
      (reason, count) => t(titleKey(reason), { n: count }),
      runningCount,
      (count) => t("title.running", { n: count })
    );
    const currentSessionTitle = state.current === void 0 ? void 0 : state.byId[state.current]?.title;
    const shellTitle = shellTitleOf(productTitle, currentSessionTitle);
    title.render(titleText, current.titleAnimation, runningCount > 0, titleEntries.length > 0, shellTitle);
    const sidebarEnabled = current.enabled && current.sidebarIndicators;
    document.documentElement.setAttribute("data-dsh-notify-sidebar", sidebarEnabled ? "on" : "off");
    sidebar.render(entries, sidebarEnabled);
  };
  ctx.effect(() => {
    const observedTurns = /* @__PURE__ */ new Map();
    const seed = () => {
      observedTurns.clear();
      const state = sessions.list.getSnapshot();
      for (const id of state.ids) {
        observedTurns.set(id, state.byId[id]?.projectionValues?.dshNotify?.turn ?? 0);
      }
    };
    seed();
    const stopList = sessions.list.subscribe(() => {
      const state = sessions.list.getSnapshot();
      const currentSettings = settings.getSnapshot();
      if (state.current !== void 0 && !document.hidden) attention.clear(state.current);
      for (const id of state.ids) {
        const summary = state.byId[id];
        if (summary === void 0 || summary.origin === "subagent") continue;
        const projection = summary.projectionValues?.dshNotify;
        const advanced = projectionAdvance(observedTurns.get(id), projection);
        observedTurns.set(id, advanced.turn);
        if (!advanced.fresh || projection === void 0) continue;
        const reason = asReason(projection.reason);
        if (reason === void 0 || !currentSettings.enabled || !reasonEnabled(currentSettings, reason)) continue;
        const entry = {
          sessionId: id,
          turn: projection.turn,
          reason,
          tone: toneOf(reason),
          title: summary.displayTitle,
          body: projection.body,
          createdAt: Date.now()
        };
        if (state.current !== id || document.hidden) attention.put(entry);
        const permission = notificationsApi()?.permission ?? "denied";
        if (shouldShowSystem(permission, currentSettings, document.hidden, id, state.current)) show(entry);
      }
      if (state.phase === "ready") {
        const live = new Set(state.ids);
        attention.retain(live);
        for (const id of observedTurns.keys()) {
          if (!live.has(id)) observedTurns.delete(id);
        }
      }
      renderSurfaces();
    });
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
      title.dispose();
      document.documentElement.removeAttribute("data-dsh-notify-sidebar");
    };
  }, "dsh-notify: surfaces");
  ctx.slots.inject("settings.section", () => ctx.slots.register({
    name: "settings.section",
    id: "dsh-notify",
    order: 60,
    label: () => t("nav"),
    locale: NS,
    inject: () => ({ hooks: { settings }, set, requestPermission, sendTest })
  }, NotifySettingsSection));
}
return module.exports; } });
//# sourceMappingURL=client.js.map
