/** Keep an inert visual copy of the entire outgoing viewport while React mounts
 * the destination. Both the app bar and body ride one compositor animation.
 * The copy lives outside React, is never interactive, and is always removed.
 */
export function animatePageSwap({ page, chrome, host, direction, commit, onFinish }: {
  page: HTMLDivElement;
  chrome?: HTMLDivElement | null;
  host: HTMLDivElement;
  direction: "push" | "pop";
  commit: () => void;
  onFinish: () => void;
}): () => void {
  // Reduced motion: no slide, and no snapshot to slide — the destination just
  // appears. A Web Animation is out of reach of the CSS opt-out in
  // globals.css, so the check has to live at the call site.
  if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    commit();
    let cancelled = false;
    // let the caller store its cleanup handle before onFinish clears it
    queueMicrotask(() => { if (!cancelled) onFinish(); });
    return () => { cancelled = true; };
  }
  const snapshot = page.cloneNode(true) as HTMLDivElement;
  snapshot.inert = true;
  snapshot.setAttribute("aria-hidden", "true");
  snapshot.dataset.pageSnapshot = direction;
  snapshot.removeAttribute("data-re1-page");
  const pageZ = Number(getComputedStyle(page).zIndex) || 6;
  // A push is ONE opaque sheet arriving over the old screen (user call), so
  // BOTH outgoing layers — body and bar — sit under the incoming page and are
  // simply covered by it, bar last because it is the leftmost thing on screen.
  // A pop still rides out on top of the page it uncovers.
  Object.assign(snapshot.style, { pointerEvents: "none", overflow: "hidden", transition: "none", animation: "none", transform: "none", zIndex: String(pageZ + (direction === "push" ? -2 : 1)) });
  const chromeSnapshot = chrome?.cloneNode(true) as HTMLDivElement | undefined;
  if (chromeSnapshot && chrome) {
    chromeSnapshot.inert = true;
    chromeSnapshot.setAttribute("aria-hidden", "true");
    chromeSnapshot.removeAttribute("data-re1-detail-chrome");
    // The outgoing bar keeps its OWN chevron (user call 2026-09-22, replacing
    // R38's single held glyph): a drill's back button belongs to its page, so
    // the arriving one rides in with the sheet and lands over the one it
    // replaces — the same handover home → L1 already plays.
    Object.assign(chromeSnapshot.style, { pointerEvents: "none", transition: "none", transform: "none", zIndex: String(direction === "push" ? pageZ - 1 : (Number(getComputedStyle(chrome).zIndex) || 60) + 1) });
    host.appendChild(chromeSnapshot);
  }
  // Keep SVG gradients local to the snapshot rather than duplicating live IDs.
  const ids = new Map<string, string>();
  snapshot.querySelectorAll("[id]").forEach(node => {
    const id = node.id;
    const next = `page-snapshot-${id}`;
    ids.set(id, next);
    node.id = next;
  });
  snapshot.querySelectorAll("*").forEach(node => {
    for (const attr of Array.from(node.attributes)) {
      let value = attr.value;
      ids.forEach((next, id) => { value = value.replaceAll(`url(#${id})`, `url(#${next})`); });
      if ((attr.name === "href" || attr.name === "xlink:href") && value.startsWith("#")) value = `#${ids.get(value.slice(1)) ?? value.slice(1)}`;
      if (value !== attr.value) node.setAttribute(attr.name, value);
    }
  });
  host.appendChild(snapshot);
  snapshot.scrollTop = page.scrollTop;
  const originals = page.querySelectorAll<HTMLElement>("*");
  snapshot.querySelectorAll<HTMLElement>("*").forEach((node, i) => {
    if (originals[i].scrollTop) node.scrollTop = originals[i].scrollTop;
    if (originals[i].scrollLeft) node.scrollLeft = originals[i].scrollLeft;
  });
  commit();
  const transition = page.style.transition;
  page.style.transition = "none";
  const chromeTransition = chrome?.style.transition;
  if (chrome) chrome.style.transition = "none";
  const options: KeyframeAnimationOptions = { duration: 420, easing: "cubic-bezier(0.32, 0.72, 0, 1)", fill: "both" };
  const entering = page.animate([
    { transform: direction === "push" ? "translateX(100%)" : "translateX(0)" },
    { transform: "translateX(0)" },
  ], options);
  const leaving = snapshot.animate([
    { transform: "translateX(0)" },
    { transform: direction === "push" ? "translateX(0)" : "translateX(100%)" },
  ], options);
  const chromeEntering = chrome?.animate([
    { transform: direction === "push" ? "translateX(100%)" : "translateX(0)" },
    { transform: "translateX(0)" },
  ], options);
  // A push leaves the old bar standing still with the body it belongs to; the
  // incoming sheet covers both. It used to fade out on its own over the first
  // third of the ride, which put a second, ghosting copy of every chip on
  // screen over a page none of them belonged to.
  const chromeLeaving = direction === "pop" ? chromeSnapshot?.animate([
    { transform: "translateX(0)" },
    { transform: "translateX(100%)" },
  ], options) : undefined;
  const animations = [entering, leaving, chromeEntering, chromeLeaving].filter((a): a is Animation => !!a);
  const startTime = document.timeline.currentTime;
  if (startTime != null) animations.forEach(a => { a.startTime = startTime; });
  let done = false;
  const cleanup = () => {
    if (done) return false;
    done = true;
    window.clearTimeout(timer);
    window.removeEventListener("resize", finish);
    document.removeEventListener("visibilitychange", onVisibility);
    animations.forEach(a => a.cancel());
    snapshot.remove();
    chromeSnapshot?.remove();
    page.style.transition = transition;
    if (chrome) chrome.style.transition = chromeTransition ?? "";
    return true;
  };
  const finish = () => { if (cleanup()) onFinish(); };
  const onVisibility = () => { if (document.hidden) finish(); };
  const timer = window.setTimeout(finish, 500);
  window.addEventListener("resize", finish);
  document.addEventListener("visibilitychange", onVisibility);
  Promise.all(animations.map(a => a.finished)).then(finish).catch(() => {});
  return () => { cleanup(); };
}
