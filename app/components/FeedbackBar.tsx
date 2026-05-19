"use client";

import { useState } from "react";
import { TEXT_PRIMARY, TEXT_TERTIARY, ALPHA_WHITE_FF } from "../lib/colors";
import SnackbarHost from "./SnackbarHost";

type Vote = "up" | "down" | null;

type FeedbackBarProps = {
  messageId?: string;
  onVote?: (vote: Vote, messageId?: string) => void;
};

const FEEDBACK_COPY = "Thank you for your feedback!";

function SnackbarTickIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path
        d="M4.5 10.5L8.5 14.5L15.5 6.5"
        stroke={ALPHA_WHITE_FF}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const THUMB_UP_PATH =
  "M12.3563 19.99H12.3363L5.0788 19.96C2.89954 19.96 1.04018 18.3706 0.760277 16.2813L0.0405238 11.103C-0.129418 9.91346 0.240455 8.70387 1.05018 7.78418L6.88818 1.3164C7.55795 0.426705 8.78753-0.103114 10.0171 0.0168451C11.0767 0.116811 12.0164 0.646629 12.6262 1.49634C13.236 2.34605 13.4059 3.39569 13.126 4.38535L12.5862 6.18473L14.7955 5.87484C16.4149 5.64492 17.9844 6.25471 19.004 7.48429C20.0237 8.72386 20.2836 10.3433 19.6938 11.8228L17.9144 16.3013C17.0347 18.5205 14.8055 20 12.3663 20L12.3563 19.99ZM9.68722 2.476C9.37733 2.476 9.06743 2.62595 8.8775 2.86587L2.98951 9.41363C2.66962 9.7835 2.51967 10.2833 2.57965 10.7732L3.29941 15.9514C3.41937 16.8211 4.1891 17.4709 5.08879 17.4809L12.3463 17.5109H12.3563C13.7458 17.5109 15.0154 16.6711 15.5152 15.4016L17.2946 10.9231C17.5545 10.2733 17.4346 9.57357 16.9947 9.03376C16.5549 8.49394 15.8651 8.23403 15.1553 8.324L10.9668 8.9138C10.5369 8.97378 10.0971 8.81383 9.81717 8.49394C9.52727 8.17405 9.43731 7.7342 9.55726 7.33434L10.6569 3.69558C10.7668 3.32571 10.6069 3.03581 10.5169 2.89586C10.427 2.75591 10.187 2.51599 9.78719 2.476C9.7572 2.476 9.72721 2.476 9.69722 2.476H9.68722Z";

const THUMB_DOWN_PATH =
  "M7.6484 0.00999641H7.66839L14.9259 0.0399876C17.1052 0.0399876 18.9645 1.62944 19.2444 3.71873L19.9642 8.89695C20.1341 10.0865 19.7642 11.2961 18.9545 12.2158L13.1165 18.6836C12.4468 19.5733 11.2172 20.1031 9.9876 19.9832C8.92796 19.8832 7.98828 19.3534 7.37849 18.5037C6.7687 17.654 6.59876 16.6043 6.87866 15.6147L7.41848 13.8153L5.20923 14.1252C3.58979 14.3551 2.02033 13.7453 1.00067 12.5157C-0.0189768 11.2761-0.278887 9.65669 0.310911 8.1772L2.0903 3.69873C2.97 1.47949 5.19924 0 7.6384 0L7.6484 0.00999641ZM10.3175 17.524C10.6274 17.524 10.9373 17.374 11.1272 17.1341L17.0152 10.5864C17.3351 10.2165 17.485 9.71667 17.425 9.22684L16.7053 4.04861C16.5853 3.17891 15.8156 2.52913 14.9159 2.51914L7.65839 2.48915H7.6484C6.25887 2.48915 4.98931 3.32886 4.48948 4.59842L2.71009 9.07689C2.45018 9.72667 2.57014 10.4264 3.00999 10.9662C3.44984 11.5061 4.1396 11.766 4.84936 11.676L9.03792 11.0862C9.46777 11.0262 9.90762 11.1862 10.1875 11.5061C10.4774 11.8259 10.5674 12.2658 10.4474 12.6657L9.34782 16.3044C9.23785 16.6743 9.3978 16.9642 9.48777 17.1041C9.57774 17.2441 9.81765 17.484 10.2175 17.524C10.2475 17.524 10.2775 17.524 10.3075 17.524H10.3175Z";

function ThumbIcon({ variant, selected }: { variant: "up" | "down"; selected: boolean }) {
  const color = selected ? TEXT_PRIMARY : TEXT_TERTIARY;
  const path = variant === "up" ? THUMB_UP_PATH : THUMB_DOWN_PATH;
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
      <path d={path} fill={color} />
    </svg>
  );
}

export default function FeedbackBar({
  messageId,
  onVote,
}: FeedbackBarProps) {
  const [vote, setVote] = useState<Vote>(null);
  const [snack, setSnack] = useState<string | null>(null);

  const handleTap = (target: "up" | "down") => {
    if (vote === target) {
      setVote(null);
      onVote?.(null, messageId);
      return;
    }
    setVote(target);
    setSnack(FEEDBACK_COPY);
    onVote?.(target, messageId);
  };

  return (
    <div className="mt-4">
      <div className="flex items-center gap-4 animate-chat-message-in">
        <button
          type="button"
          onClick={() => handleTap("up")}
          aria-label="Thumbs up"
          aria-pressed={vote === "up"}
          className="flex items-center"
        >
          <ThumbIcon variant="up" selected={vote === "up"} />
        </button>
        <button
          type="button"
          onClick={() => handleTap("down")}
          aria-label="Thumbs down"
          aria-pressed={vote === "down"}
          className="flex items-center"
        >
          <ThumbIcon variant="down" selected={vote === "down"} />
        </button>
      </div>
      <SnackbarHost
        open={snack !== null}
        onClose={() => setSnack(null)}
        text={snack ?? ""}
        icon={<SnackbarTickIcon />}
        duration={3000}
      />
    </div>
  );
}
