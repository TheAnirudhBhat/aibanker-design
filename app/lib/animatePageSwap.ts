/** Keep an inert visual copy of the entire outgoing viewport while React mounts
 * the destination. Both the app bar and body ride one compositor animation.
 * The copy lives outside React, is never interactive, and is always removed.
 */
export function animatePageSwap({ page, host, direction, commit, onFinish }: {
  page: HTMLDivElement;
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
  Object.assign(snapshot.style, { pointerEvents: "none", overflow: "hidden", transition: "none", animation: "none", transform: "none", zIndex: direction === "push" ? "5" : "7" });
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
  const originalZIndex = page.style.zIndex;
  if (direction === "push") page.style.zIndex = "6";
  page.style.transition = "none";
  const options: KeyframeAnimationOptions = { duration: 420, easing: "cubic-bezier(0.32, 0.72, 0, 1)", fill: "both" };
  const entering = page.animate([
    { transform: direction === "push" ? "translateX(100%)" : "translateX(-24%)" },
    { transform: "translateX(0)" },
  ], options);
  const leaving = snapshot.animate([
    { transform: "translateX(0)" },
    { transform: direction === "push" ? "translateX(0)" : "translateX(100%)" },
  ], options);
  let done = false;
  const cleanup = () => {
    if (done) return false;
    done = true;
    window.clearTimeout(timer);
    window.removeEventListener("resize", finish);
    document.removeEventListener("visibilitychange", onVisibility);
    entering.cancel();
    leaving.cancel();
    snapshot.remove();
    page.style.transition = transition;
    page.style.zIndex = originalZIndex;
    return true;
  };
  const finish = () => { if (cleanup()) onFinish(); };
  const onVisibility = () => { if (document.hidden) finish(); };
  const timer = window.setTimeout(finish, 500);
  window.addEventListener("resize", finish);
  document.addEventListener("visibilitychange", onVisibility);
  Promise.all([entering.finished, leaving.finished]).then(finish).catch(() => {});
  return () => { cleanup(); };
}
