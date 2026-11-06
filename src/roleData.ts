/* =========================================================
   ROLE ACTIONS & PASSIVES
   Names + descriptions, shown on hover in Battle Grounds.
   Keep in sync with ROLE_DETAILS / ROLE_GUIDE_DETAILS in App.tsx.
   ========================================================= */

export type RoleAbilities = {
  action: string;
  actionText: string;
  passive: string;
  passiveText: string;
};

export const ROLE_ABILITIES: Record<string, RoleAbilities> = {
  Caretaker: {
    action: "Gentle Hands",
    actionText:
      "You are able to provide care for those in need. Healing and comfort are your specialty. Any items that can give either two, food or a simple bandage will inherit your healing or comforting effect.",
    passive: "Care Bear",
    passiveText:
      "You know how someone feels using your perception. You know their pain and worries as if it is yours, cause the moment you touch them, you own it too.",
  },

  Dreamer: {
    action: "Twin Forms: Daydream or Nightmare",
    actionText:
      "You pull a wool of wonder in your eyes and see things in a silver lining. You believe in happy endings and that the good guys will win. You give a +3 in rolls for people around you (15ft).",
    passive: "Dreamwalk",
    passiveText:
      "You are always in a state of dream. Everything is hazy and you don't recall information as much as other people.",
  },

  Guardian: {
    action: "Come At Me",
    actionText:
      "You are able to force a monster to focus on you. Choose a monster within 30 ft that can see or hear you. You force its attention onto you.",
    passive: "Iron Clad",
    passiveText:
      "You are the least affected by Dread. You are too busy protecting everyone else, you simply forgot to check on yourself.",
  },

  Adversary: {
    action: "Weaponized",
    actionText:
      "Any object you touch inherits your will to harm. It changes form into any weapon you wish to wield, except for projectile weapons. The object can become the weapon itself, but it cannot create or transform the bullets, arrows, or other projectiles needed to use it.",
    passive: "Berserk Blood",
    passiveText:
      "You are prone to losing control, especially when affected by Dread. Each successful attack feeds your Berserk. The more you attack, the deeper you lose yourself to it.",
  },

  Archivist: {
    action: "Paper Trail",
    actionText:
      "Everyone leaves a record. Nothing comes and goes without the Hotel knowing—not even the dead.",
    passive: "True Record",
    passiveText:
      "You never forget a detail. Once seen, once read, once heard, it stays with you.",
  },

  Diplomat: {
    action: "Social Butterfly",
    actionText:
      "You can talk your way through almost anything, even with Dreadlings hungry for your memories.",
    passive: "Charming",
    passiveText:
      "You are naturally likeable. You radiate a soothing aura that helps calm anger and ease emotions that cloud the mind and heart.",
  },

  Watcher: {
    action: "Passive Stance",
    actionText:
      "You can enter Passive Stance once per encounter. At the beginning of Initiative, you may declare Passive Stance and remain outside the encounter.",
    passive: "Camera View",
    passiveText:
      "You can view the world through the lenses of the Hotel's cameras; seeing the past, present, or future.",
  },

  Vessel: {
    action: "One Body",
    actionText:
      "You are able to draw upon the strengths of those around you. For a brief moment, you become more than yourself, taking on an ability or trait belonging to another Guest.",
    passive: "Bridge",
    passiveText:
      "You are able to form a bridge between you and a chosen target. There is no limit to how many bridges, it's just that it must be with consent. The deeper the connection, the sturdier the bridge, the easier it is to draw powers from others.",
  },

  Timekeeper: {
    action: "Time Out",
    actionText:
      "You may briefly interrupt the flow of time within your immediate surroundings. For a moment, movement and events around you come to a standstill, allowing you to act, reposition yourself, or prevent an unfolding situation from progressing. What you can affect is limited, and time will always demand that the moment be returned.",
    passive: "All-Time",
    passiveText:
      "You possess an unusual awareness of time's inconsistencies. You can recognize repeated moments, notice when events occur out of order, and sense when something has been altered, skipped, or caught in a loop. You may not know why time has changed, but you will know that it has.",
  },

  Doorman: {
    action: "Open-Door",
    actionText:
      "You may open a passage where one should not exist or force open a way that has been sealed, blocked, or forbidden. For a brief moment, you can establish a connection between two accessible thresholds, allowing yourself and others to pass through. The passage cannot lead somewhere you have no means of identifying or reaching.",
    passive: "Unmovable",
    passiveText:
      "You are exceptionally difficult to displace, restrain, or force beyond a threshold you have chosen to guard. You can also sense when a boundary has been crossed without permission, whether the trespasser is a guest, an anomaly, or something the hotel refuses to acknowledge.",
  },

  Overseer: {
    action: "Dominance",
    actionText:
      "You impose your will upon your immediate surroundings, briefly shifting an area's conditions to suit your needs. You may alter the atmosphere, influence the behavior of nearby environmental features, or establish a temporary condition that benefits you and your allies. Your influence has limits; you can shape what is present, but you cannot create anything from nothing.",
    passive: "Gentle Voice",
    passiveText:
      "Your presence carries an inexplicable authority that encourages others to listen. Your voice can soothe agitation, steady frightened guests, and make your intentions easier to understand. Even those who distrust you may find themselves listening before deciding whether to obey. Your influence cannot guarantee agreement or override another person's will.",
  },

  Mnēmosynē: {
    action: "Take Root",
    actionText:
      "You anchor a memory, identity, or piece of information against forces that would erase, distort, or rewrite it. You may preserve a recollection within yourself or help another person hold on to something they are about to lose. While the effect lasts, the protected memory cannot easily be altered or removed, though the truth it contains may still be misunderstood.",
    passive: "I Recall",
    passiveText:
      "Nothing you have genuinely experienced is ever entirely lost to you. You can revisit fragments of your own memories with unusual clarity and recognize details that others have forgotten. When confronted with familiar people, places, or events, forgotten recollections may resurface unexpectedly. You cannot recall an experience you never encountered, nor does remembering guarantee that your interpretation was correct.",
  },
};