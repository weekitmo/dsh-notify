export const STYLE_ID = 'dsh-notify-style'

export const cssText = `
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
.dsh_notify_indicatorHost { display:inline-flex !important; align-items:center; justify-content:center; flex:none; width:16px; height:20px; }
.dsh_notify_indicatorHost > [data-state] { display:none !important; }
[data-dsh-notify-indicator] { position:relative; display:inline-block; width:10px; height:10px; color:var(--dsw-alias-state-success-primary); }
[data-dsh-notify-indicator][data-tone='error'] { color:var(--dsw-alias-state-error-primary); }
[data-dsh-notify-indicator]::before, [data-dsh-notify-indicator]::after { content:''; position:absolute; border-radius:50%; background:currentColor; }
[data-dsh-notify-indicator]::before { inset:2px; }
[data-dsh-notify-indicator]::after { inset:0; opacity:.18; animation:dsh-notify-pulse 1.5s ease-out infinite; }
@keyframes dsh-notify-pulse { 0% { transform:scale(.6); opacity:.32; } 70%,100% { transform:scale(1.7); opacity:0; } }
@media (prefers-reduced-motion: reduce) { [data-dsh-notify-indicator]::after { animation:none; } }
`

export function adoptStyles(): () => void {
  document.getElementById(STYLE_ID)?.remove()
  const style = document.createElement('style')
  style.id = STYLE_ID
  style.textContent = cssText
  document.head.appendChild(style)
  return () => { style.remove() }
}
