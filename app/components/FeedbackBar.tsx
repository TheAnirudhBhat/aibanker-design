"use client";

import { useEffect, useRef, useState } from "react";
import { TEXT_TERTIARY } from "../lib/colors";
import SnackbarHost from "./SnackbarHost";
import FeedbackSheet from "./FeedbackSheet";

type Vote = "up" | "down" | null;

type FeedbackBarProps = {
  messageId?: string;
  onVote?: (vote: Vote, messageId?: string) => void;
};

const FEEDBACK_COPY = "Thank you for your feedback"; // canon 1115:15362 — no exclamation

// Outline (rest) glyphs.
const THUMB_UP_PATH =
  "M12.3563 19.99H12.3363L5.0788 19.96C2.89954 19.96 1.04018 18.3706 0.760277 16.2813L0.0405238 11.103C-0.129418 9.91346 0.240455 8.70387 1.05018 7.78418L6.88818 1.3164C7.55795 0.426705 8.78753-0.103114 10.0171 0.0168451C11.0767 0.116811 12.0164 0.646629 12.6262 1.49634C13.236 2.34605 13.4059 3.39569 13.126 4.38535L12.5862 6.18473L14.7955 5.87484C16.4149 5.64492 17.9844 6.25471 19.004 7.48429C20.0237 8.72386 20.2836 10.3433 19.6938 11.8228L17.9144 16.3013C17.0347 18.5205 14.8055 20 12.3663 20L12.3563 19.99ZM9.68722 2.476C9.37733 2.476 9.06743 2.62595 8.8775 2.86587L2.98951 9.41363C2.66962 9.7835 2.51967 10.2833 2.57965 10.7732L3.29941 15.9514C3.41937 16.8211 4.1891 17.4709 5.08879 17.4809L12.3463 17.5109H12.3563C13.7458 17.5109 15.0154 16.6711 15.5152 15.4016L17.2946 10.9231C17.5545 10.2733 17.4346 9.57357 16.9947 9.03376C16.5549 8.49394 15.8651 8.23403 15.1553 8.324L10.9668 8.9138C10.5369 8.97378 10.0971 8.81383 9.81717 8.49394C9.52727 8.17405 9.43731 7.7342 9.55726 7.33434L10.6569 3.69558C10.7668 3.32571 10.6069 3.03581 10.5169 2.89586C10.427 2.75591 10.187 2.51599 9.78719 2.476C9.7572 2.476 9.72721 2.476 9.69722 2.476H9.68722Z";

const THUMB_DOWN_PATH =
  "M7.6484 0.00999641H7.66839L14.9259 0.0399876C17.1052 0.0399876 18.9645 1.62944 19.2444 3.71873L19.9642 8.89695C20.1341 10.0865 19.7642 11.2961 18.9545 12.2158L13.1165 18.6836C12.4468 19.5733 11.2172 20.1031 9.9876 19.9832C8.92796 19.8832 7.98828 19.3534 7.37849 18.5037C6.7687 17.654 6.59876 16.6043 6.87866 15.6147L7.41848 13.8153L5.20923 14.1252C3.58979 14.3551 2.02033 13.7453 1.00067 12.5157C-0.0189768 11.2761-0.278887 9.65669 0.310911 8.1772L2.0903 3.69873C2.97 1.47949 5.19924 0 7.6384 0L7.6484 0.00999641ZM10.3175 17.524C10.6274 17.524 10.9373 17.374 11.1272 17.1341L17.0152 10.5864C17.3351 10.2165 17.485 9.71667 17.425 9.22684L16.7053 4.04861C16.5853 3.17891 15.8156 2.52913 14.9159 2.51914L7.65839 2.48915H7.6484C6.25887 2.48915 4.98931 3.32886 4.48948 4.59842L2.71009 9.07689C2.45018 9.72667 2.57014 10.4264 3.00999 10.9662C3.44984 11.5061 4.1396 11.766 4.84936 11.676L9.03792 11.0862C9.46777 11.0262 9.90762 11.1862 10.1875 11.5061C10.4774 11.8259 10.5674 12.2658 10.4474 12.6657L9.34782 16.3044C9.23785 16.6743 9.3978 16.9642 9.48777 17.1041C9.57774 17.2441 9.81765 17.484 10.2175 17.524C10.2475 17.524 10.2775 17.524 10.3075 17.524H10.3175Z";

// Filled (selected) glyphs — exported from the pressed-state frames in canon 1147:15797. Each is
// the outline plus its interior, so the thumb reads solid at the same tone as the outline.
const THUMB_UP_FILLED_PATHS = [
  "M12.1972 19.3257H12.1785L5.40366 19.2977C3.36932 19.2977 1.63361 17.814 1.37232 15.8636L0.700427 11.0297C0.541786 9.91925 0.887063 8.7901 1.64294 7.93158L7.09271 1.8939C7.71794 1.06337 8.86576 0.568782 10.0136 0.680764C11.0027 0.774082 11.8799 1.26867 12.4492 2.06187C13.0184 2.85507 13.177 3.83491 12.9158 4.75876L12.4118 6.43849L14.4742 6.1492C15.9859 5.93457 17.451 6.50381 18.4029 7.65162C19.3547 8.80877 19.5973 10.3205 19.0468 11.7016L17.3857 15.8823C16.5645 17.9539 14.4835 19.335 12.2065 19.335L12.1972 19.3257ZM9.70562 2.97639C9.41633 2.97639 9.12705 3.11636 8.94974 3.34033L3.45331 9.45266C3.15469 9.79794 3.01471 10.2645 3.0707 10.7218L3.74259 15.5557C3.85458 16.3675 4.57313 16.9741 5.41299 16.9834L12.1879 17.0114H12.1972C13.4943 17.0114 14.6795 16.2275 15.1461 15.0424L16.8071 10.8618C17.0497 10.2552 16.9378 9.60197 16.5272 9.09805C16.1166 8.59413 15.4727 8.35151 14.8101 8.43549L10.9001 8.98607C10.4988 9.04206 10.0882 8.89275 9.82693 8.59413C9.55631 8.29552 9.47232 7.88492 9.5843 7.51164L10.6108 4.11487C10.7135 3.76959 10.5641 3.49897 10.4802 3.36832C10.3962 3.23768 10.1722 3.01371 9.79894 2.97639C9.77094 2.97639 9.74294 2.97639 9.71495 2.97639H9.70562Z",
  "M9.70562 2.97639C9.41633 2.97639 9.12705 3.11636 8.94974 3.34033L3.45331 9.45266C3.15469 9.79794 3.01471 10.2645 3.0707 10.7218L3.74259 15.5557C3.85458 16.3675 4.57313 16.9741 5.41299 16.9834L12.1879 17.0114H12.1972C13.4943 17.0114 14.6795 16.2275 15.1461 15.0424L16.8071 10.8618C17.0497 10.2552 16.9378 9.60197 16.5272 9.09805C16.1166 8.59413 15.4727 8.35151 14.8101 8.43549L10.9001 8.98607C10.4988 9.04206 10.0882 8.89275 9.82693 8.59413C9.55631 8.29552 9.47232 7.88492 9.5843 7.51164L10.6108 4.11487C10.7135 3.76959 10.5641 3.49897 10.4802 3.36832C10.3962 3.23768 10.1722 3.01371 9.79894 2.97639H9.71495H9.70562Z",
];

const THUMB_DOWN_FILLED_PATHS = [
  "M7.80091 0.674371H7.81958L14.5945 0.702367C16.6288 0.702367 18.3645 2.18612 18.6258 4.13647L19.2977 8.97034C19.4563 10.0808 19.1111 11.21 18.3552 12.0685L12.9054 18.1062C12.2802 18.9367 11.1324 19.4313 9.98455 19.3193C8.99538 19.226 8.11819 18.7314 7.54895 17.9382C6.97971 17.145 6.82107 16.1652 7.08236 15.2413L7.58628 13.5616L5.52395 13.8509C4.0122 14.0655 2.54711 13.4963 1.59526 12.3485C0.643418 11.1913 0.400791 9.67956 0.951368 8.29845L2.61243 4.11781C3.43363 2.04615 5.51462 0.665039 7.79158 0.665039L7.80091 0.674371ZM10.2925 17.0237C10.5818 17.0237 10.8711 16.8837 11.0484 16.6597L16.5448 10.5474C16.8434 10.2021 16.9834 9.73555 16.9274 9.27829L16.2555 4.44442C16.1435 3.63255 15.425 3.02599 14.5851 3.01665L7.81024 2.98866H7.80091C6.50379 2.98866 5.31865 3.77253 4.85206 4.95767L3.191 9.13832C2.94838 9.74488 3.06036 10.3981 3.47096 10.902C3.88156 11.4059 4.52545 11.6486 5.18801 11.5646L9.09803 11.014C9.4993 10.958 9.9099 11.1073 10.1712 11.4059C10.4418 11.7046 10.5258 12.1152 10.4138 12.4884L9.38732 15.8852C9.28467 16.2305 9.43398 16.5011 9.51796 16.6318C9.60195 16.7624 9.82591 16.9864 10.1992 17.0237C10.2272 17.0237 10.2552 17.0237 10.2832 17.0237H10.2925Z",
  "M10.2925 17.0237C10.5818 17.0237 10.8711 16.8837 11.0484 16.6597L16.5448 10.5474C16.8434 10.2021 16.9834 9.73555 16.9274 9.27829L16.2555 4.44442C16.1435 3.63255 15.425 3.02599 14.5851 3.01665L7.81024 2.98866H7.80091C6.50379 2.98866 5.31865 3.77253 4.85206 4.95767L3.191 9.13832C2.94838 9.74488 3.06036 10.3981 3.47096 10.902C3.88156 11.4059 4.52545 11.6486 5.18801 11.5646L9.09803 11.014C9.4993 10.958 9.9099 11.1073 10.1712 11.4059C10.4418 11.7046 10.5258 12.1152 10.4138 12.4884L9.38732 15.8852C9.28467 16.2305 9.43398 16.5011 9.51796 16.6318C9.60195 16.7624 9.82591 16.9864 10.1992 17.0237H10.2832H10.2925Z",
];

// Canon 1147:15797 draws a 20px glyph in a 28px box at TEXT_SECONDARY; sized down to a 16px
// glyph in a 24px box at TEXT_TERTIARY on the designer's direction (2026-07-31) — don't
// "fix" this back on a future canonical re-match. Gap 8; the chosen thumb switches to its
// FILLED glyph and the other one leaves.
const ICON_SIZE = 16;
const TAP_SIZE = 24;

function ThumbIcon({ variant, filled }: { variant: "up" | "down"; filled: boolean }) {
  const paths = filled
    ? variant === "up" ? THUMB_UP_FILLED_PATHS : THUMB_DOWN_FILLED_PATHS
    : [variant === "up" ? THUMB_UP_PATH : THUMB_DOWN_PATH];
  return (
    <svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 20 20" fill="none">
      {paths.map((d, i) => (
        <path key={i} d={d} fill={TEXT_TERTIARY} />
      ))}
    </svg>
  );
}

export default function FeedbackBar({
  messageId,
  onVote,
}: FeedbackBarProps) {
  const [vote, setVote] = useState<Vote>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [snack, setSnack] = useState<string | null>(null);
  const snackTimer = useRef<number | null>(null);
  useEffect(() => () => { if (snackTimer.current !== null) window.clearTimeout(snackTimer.current); }, []);

  const handleTap = (target: "up" | "down") => {
    if (vote === target) {
      // Tapping the filled thumb again clears the rating and brings both back.
      setVote(null);
      onVote?.(null, messageId);
      return;
    }
    setVote(target);
    onVote?.(target, messageId);
    // Dislike asks why — the snackbar waits for the sheet's Submit (canon flow). A like just fills.
    if (target === "down") setSheetOpen(true);
  };

  return (
    <div className="mt-4">
      {/* Both thumbs stay mounted; the unchosen one collapses (width + fade + shrink) so the
          chosen one SLIDES into place through flex flow instead of snapping when its sibling
          unmounts. The fill lands with a small pop. */}
      <div className="flex items-center animate-chat-message-in">
        {(["up", "down"] as const).map((variant) => {
          const chosen = vote === variant;
          const hidden = vote !== null && !chosen;
          return (
            <button
              key={variant}
              type="button"
              onClick={() => handleTap(variant)}
              aria-label={variant === "up" ? "Thumbs up" : "Thumbs down"}
              aria-pressed={chosen}
              aria-hidden={hidden}
              tabIndex={hidden ? -1 : 0}
              className="flex items-center justify-center active:scale-90"
              style={{
                width: hidden ? 0 : TAP_SIZE,
                height: TAP_SIZE,
                // the 8px gap lives on the second thumb and collapses with a vote, so the
                // survivor glides all the way to the row start
                marginLeft: variant === "down" && vote === null ? 8 : 0,
                opacity: hidden ? 0 : 1,
                transform: hidden ? "scale(0.5)" : "scale(1)",
                overflow: "hidden",
                pointerEvents: hidden ? "none" : "auto",
                transition:
                  "width 260ms cubic-bezier(0.22, 1, 0.36, 1), margin-left 260ms cubic-bezier(0.22, 1, 0.36, 1), opacity 160ms ease, transform 260ms cubic-bezier(0.22, 1, 0.36, 1)",
              }}
            >
              <span
                className="flex items-center justify-center"
                style={chosen ? { animation: "thumbPop 340ms cubic-bezier(0.34, 1.56, 0.64, 1)" } : undefined}
              >
                <ThumbIcon variant={variant} filled={chosen} />
              </span>
            </button>
          );
        })}
      </div>
      <FeedbackSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onSubmit={() => {
          setSheetOpen(false);
          // Waits out the sheet's exit and the phone keyboard's drop — mounting the toast
          // mid-collapse teleported it down the re-growing page (IMG_3292).
          if (snackTimer.current !== null) window.clearTimeout(snackTimer.current);
          snackTimer.current = window.setTimeout(() => setSnack(FEEDBACK_COPY), 450);
        }}
      />
      {/* Canon 1115:15441: text + trailing Dismiss, no leading icon. Still times out on its own. */}
      <SnackbarHost
        open={snack !== null}
        onClose={() => setSnack(null)}
        text={snack ?? ""}
        action={{ label: "Dismiss", onClick: () => setSnack(null) }}
        autoDismissWithAction
        duration={4000}
      />
    </div>
  );
}
