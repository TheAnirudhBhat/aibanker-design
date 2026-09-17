import type { MetadataRoute } from "next";

// iOS 26 installs a home-screen site as a genuine web app only when a manifest
// declares its display mode. The legacy meta-tag-only path (a "web clip") is
// the one that lays the page out short of the physical bottom edge under a
// translucent status bar: the dead band under the ask bar (R39). No start_url:
// each persona's icon keeps opening the page it was added from. Re-add the icon
// after this lands, iOS captures the configuration at add time.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "slice banker",
    short_name: "slice banker",
    display: "standalone",
    background_color: "#ffffff",
    icons: [{ src: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  };
}
