/**
 * Hecate's Crossroads — Theme Registry
 * 
 * Mobile-optimized layout map for the Crossroads landing screen.
 * All coordinates are expressed as PERCENTAGES of viewport dimensions
 * so they scale correctly across any mobile screen size.
 *
 * Reference viewport: 390 × 844 px (iPhone 14)
 */

export const hecateCrossroadsTheme = {
  meta: {
    name: "Hecate's Crossroads",
    version: "1.0.0",
    viewport: { width: 390, height: 844 },
    orientation: "portrait",
  },

  assets: {
    background: "/hecate-crossroads.jpg",
    uiMarkers: "/hecate-crossroads-ui.jpeg",
  },

  /**
   * Clickable zones — all values are percentages of the viewport (0–100).
   * xPct / yPct = top-left corner; wPct / hPct = dimensions.
   * Use these to position <button> elements absolutely over the background.
   */
  zones: {
    wisdomPath: {
      id: "wisdom-path",
      label: "Wisdom Path",
      description: "The road that stretches toward the moon — knowledge and illumination.",
      xPct: 34,   // ~133px of 390
      yPct: 30,   // ~253px of 844
      wPct: 32,   // ~125px
      hPct: 10,   // ~84px
      shape: "ellipse",
      glowColor: "rgba(139, 92, 246, 0.45)",  // violet
    },
    practicePath: {
      id: "practice-path",
      label: "Practice Path",
      description: "The winding left road — ritual, devotion, and the sacred arts.",
      xPct: 2,    // ~8px
      yPct: 50,   // ~422px
      wPct: 24,   // ~94px
      hPct: 13,   // ~110px
      shape: "ellipse",
      glowColor: "rgba(59, 130, 246, 0.45)",  // blue
    },
    connectionPath: {
      id: "connection-path",
      label: "Connection Path",
      description: "The curving right road — community, kinship, and guidance.",
      xPct: 74,   // ~289px
      yPct: 50,   // ~422px
      wPct: 24,   // ~94px
      hPct: 13,   // ~110px
      shape: "ellipse",
      glowColor: "rgba(236, 72, 153, 0.40)",  // rose
    },
    hecateStatue: {
      id: "hecate-statue",
      label: "Hecate — Goddess of the Crossroads",
      description: "The triple goddess stands at the intersection of all paths. Click to enter the Coven.",
      xPct: 28,   // ~109px
      yPct: 48,   // ~405px
      wPct: 44,   // ~172px
      hPct: 22,   // ~186px
      shape: "ellipse",
      glowColor: "rgba(251, 191, 36, 0.50)",  // golden
    },
    bottomPath: {
      id: "bottom-path",
      label: "Enter the Crossroads",
      description: "The road from which you arrived — return to choose your path.",
      xPct: 15,   // ~59px
      yPct: 83,   // ~700px
      wPct: 70,   // ~273px
      hPct: 10,   // ~84px
      shape: "ellipse",
      glowColor: "rgba(251, 191, 36, 0.30)",
    },
  },

  /**
   * Path → page mappings
   */
  paths: {
    wisdom: {
      id: "wisdom",
      name: "Wisdom Path",
      subtitle: "Illuminate the Mind",
      icon: "⚡",
      color: "#8b5cf6",
      gradientFrom: "rgba(88, 28, 135, 0.95)",
      gradientTo: "rgba(30, 10, 60, 0.98)",
      pages: [
        {
          id: "dashboard",
          name: "Dashboard",
          icon: "🌙",
          description: "Your sacred overview — recent activity, moon phase, and daily guidance.",
          route: "/dashboard",
        },
        {
          id: "knowledge-graph",
          name: "Knowledge Graph",
          icon: "🕸️",
          description: "A living web of arcane knowledge — explore connections between symbols, deities, and traditions.",
          route: "/knowledge-graph",
        },
        {
          id: "chakra-intelligence",
          name: "Chakra Intelligence",
          icon: "✨",
          description: "Navigate your energy body — balance, visualize, and activate your chakra system.",
          route: "/chakra-intelligence",
        },
        {
          id: "sigil-lab",
          name: "Sigil Lab",
          icon: "🔯",
          description: "Craft and charge personal sigils using sacred geometry and intention.",
          route: "/sigil-lab",
        },
      ],
    },
    practice: {
      id: "practice",
      name: "Practice Path",
      subtitle: "Deepen the Work",
      icon: "🕯️",
      color: "#3b82f6",
      gradientFrom: "rgba(10, 30, 80, 0.95)",
      gradientTo: "rgba(5, 15, 40, 0.98)",
      pages: [
        {
          id: "altars",
          name: "Altars",
          icon: "🏛️",
          description: "Build and tend your sacred spaces — arrange offerings, objects, and elemental correspondences.",
          route: "/altars",
        },
        {
          id: "ritual-tracker",
          name: "Ritual Tracker",
          icon: "📿",
          description: "Record and reflect on your ritual practice — timing, intention, and results.",
          route: "/ritual-tracker",
        },
        {
          id: "divination",
          name: "Divination",
          icon: "🔮",
          description: "Consult the oracle — tarot, runes, pendulum, and other divination tools.",
          route: "/divination",
        },
        {
          id: "journal",
          name: "Journal",
          icon: "📖",
          description: "Your magical diary — dreams, visions, synchronicities, and reflections.",
          route: "/journal",
        },
      ],
    },
    connection: {
      id: "connection",
      name: "Connection Path",
      subtitle: "Weave the Web",
      icon: "🌐",
      color: "#ec4899",
      gradientFrom: "rgba(70, 10, 50, 0.95)",
      gradientTo: "rgba(30, 5, 25, 0.98)",
      pages: [
        {
          id: "forum",
          name: "Forum",
          icon: "💬",
          description: "Gather in the sacred circle — discuss, share, and learn with practitioners worldwide.",
          route: "/forum",
        },
        {
          id: "covens",
          name: "Covens",
          icon: "⭕",
          description: "Find or form your magical family — join covens aligned with your path and tradition.",
          route: "/covens",
        },
        {
          id: "marketplace",
          name: "Marketplace",
          icon: "🪬",
          description: "Source sacred supplies from trusted practitioners — herbs, crystals, tools, and handcrafted items.",
          route: "/marketplace",
        },
        {
          id: "ai-mentor",
          name: "AI Mentor",
          icon: "🌟",
          description: "Consult the digital oracle — receive personalized guidance from an AI trained in mystical traditions.",
          route: "/ai-mentor",
        },
        {
          id: "settings",
          name: "Settings",
          icon: "⚙️",
          description: "Personalize your practice — notifications, privacy, appearance, and account.",
          route: "/settings",
        },
      ],
    },
  },

  /**
   * Hecate / Coven feature placeholder
   */
  covenIntegration: {
    placeholder: true,
    featureId: "coven-central",
    description: "Future: Clicking the Hecate statue will open Coven Central — a sacred space for coven leaders and members to collaborate, share rituals, and hold virtual circles.",
    plannedRoute: "/coven",
    plannedFeatures: [
      "Virtual circle / ritual space",
      "Coven membership management",
      "Shared grimoire",
      "Coven calendar & moon circle planning",
      "Elder / High Priestess tiers",
    ],
  },

  /**
   * Animation parameters
   */
  animations: {
    modalOpen: {
      type: "fade+slide",
      duration: 380,
      easing: "cubic-bezier(0.16, 1, 0.3, 1)",
      backdropFade: { from: 0, to: 1, duration: 300 },
      panelSlide: { from: "translateY(100%)", to: "translateY(0%)" },
      panelFade: { from: 0, to: 1, duration: 350 },
    },
    modalClose: {
      type: "fade+slide",
      duration: 280,
      easing: "cubic-bezier(0.4, 0, 1, 1)",
      backdropFade: { from: 1, to: 0, duration: 250 },
      panelSlide: { from: "translateY(0%)", to: "translateY(100%)" },
      panelFade: { from: 1, to: 0, duration: 220 },
    },
    pageTransition: {
      type: "slide-rtl+fade",
      duration: 420,
      easing: "cubic-bezier(0.16, 1, 0.3, 1)",
      enter: {
        translateX: { from: "100%", to: "0%" },
        opacity: { from: 0, to: 1 },
        duration: 420,
      },
      exit: {
        translateX: { from: "0%", to: "-30%" },
        opacity: { from: 1, to: 0 },
        duration: 320,
      },
    },
    pathZoneHover: {
      glowPulse: { duration: 1800, easing: "ease-in-out", repeat: "infinite" },
      scale: 1.08,
    },
    statueGlow: {
      goldenAura: { duration: 3000, easing: "ease-in-out", repeat: "infinite" },
      torchFlicker: { duration: 1800, easing: "ease-in-out", repeat: "infinite" },
    },
  },

  /**
   * Mobile-specific recommendations
   */
  mobile: {
    safeAreaPadding: { top: 44, bottom: 34 },
    modalMaxHeight: "82vh",
    modalBorderRadius: "24px 24px 0 0",
    touchTargetMinSize: 44,
    hapticFeedback: true,
  },
} as const;

export type PathId = "wisdom" | "practice" | "connection";
export type ZoneId = keyof typeof hecateCrossroadsTheme.zones;

export default hecateCrossroadsTheme;
