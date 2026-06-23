import { Bird, BrainCircuit, FlameKindling } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import type { ThemeId } from "@/store/theme";

export interface ThemeMeta {
  id: ThemeId;
  /** Wordmark shown in the logo. */
  name: string;
  /** Short descriptor under the wordmark. */
  tagline: string;
  /** The "persona" of this world (used on switcher cards). */
  persona: string;
  /** Emblem glyph. */
  icon: LucideIcon;
  /** Per-theme copy for the conversation surface. */
  chat: {
    heading: string;
    subtitle: string;
    placeholder: string;
    /** Heading above the returned recommendation cards. */
    results: string;
    /** Loading line while the agent works. */
    loading: string;
    /** Label on the reasoning note attached to each pick. */
    noteLabel: string;
    /** Empty-state prompt. */
    emptyTitle: string;
  };
}

export const THEME_META: Record<ThemeId, ThemeMeta> = {
  lantern: {
    id: "lantern",
    name: "Lantern Reads",
    tagline: "Cozy Discoveries",
    persona: "The Lantern & Scroll",
    icon: FlameKindling,
    chat: {
      heading: "The Hearth",
      subtitle: "Pull up a chair by the fire and tell the Scout what you long to read.",
      placeholder: "What kind of world do you want to escape into tonight?",
      results: "We found this for your quiet night",
      loading: "The Scout is wandering the stacks…",
      noteLabel: "Archivist's Note",
      emptyTitle: "What tale shall we conjure tonight?",
    },
  },
  lumina: {
    id: "lumina",
    name: "Lumina Books",
    tagline: "Personal Archivist",
    persona: "The Luminescent Archivist",
    icon: BrainCircuit,
    chat: {
      heading: "Welcome to the Archives",
      subtitle: "Step into the luminescent stacks — the Archivist is listening.",
      placeholder: "What journey awaits you?",
      results: "Drawn from the Archives",
      loading: "Consulting the luminous archives…",
      noteLabel: "Archivist's Note",
      emptyTitle: "What journey awaits you?",
    },
  },
  phoenix: {
    id: "phoenix",
    name: "Phoenix Pages",
    tagline: "Intelligent Insights",
    persona: "The Origami Phoenix",
    icon: Bird,
    chat: {
      heading: "Consult the Oracle",
      subtitle: "Share your mood, and the Oracle will fold the perfect story for you.",
      placeholder: "Share your mood, and we will find your story…",
      results: "Your curated journey",
      loading: "The Oracle is divining your story…",
      noteLabel: "Oracle's Insight",
      emptyTitle: "What story is calling to you?",
    },
  },
};
