import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";

const OUT_DIR = join(process.cwd(), "public", "studymate-assets");
const PNG_SIZE = 1024;

const palette = {
  ink: "#192033",
  paper: "#F6EAD3",
  paperAlt: "#F1E2BF",
  ivory: "#FFF8EC",
  cloud: "#F6F8FC",
  slate: "#75839C",
  steel: "#9CADC9",
  gold: "#D8B35A",
  goldDark: "#B98B2F",
  violet: "#6F56E8",
  indigo: "#42308E",
  blue: "#4F8AF7",
  blueDeep: "#2E5FB6",
  green: "#31A77A",
  greenDeep: "#1F7D5A",
  amber: "#D59A35",
  amberDeep: "#A66F16",
  rose: "#D56D77",
  skin: "#D9A57F",
  skinDeep: "#B97E5C",
  shadow: "rgba(25, 32, 51, 0.16)",
  softShadow: "rgba(25, 32, 51, 0.08)",
};

const avatars = [
  { name: "guide-base", variant: "base", title: "Core Guide" },
  { name: "guide-demo", variant: "demo", title: "Judge Demo" },
  { name: "guide-beginner", variant: "beginner", title: "Beginner" },
  { name: "guide-advanced", variant: "advanced", title: "Advanced" },
  { name: "guide-success", variant: "success", title: "Success" },
  { name: "guide-law", variant: "law", title: "Law" },
  { name: "guide-engineering", variant: "engineering", title: "Engineering" },
  { name: "guide-medicine", variant: "medicine", title: "Medicine" },
  { name: "guide-economics", variant: "economics", title: "Economics" },
  { name: "guide-neutral", variant: "neutral", title: "Neutral" },
];

const characters = [
  { name: "character-client", role: "client" },
  { name: "character-patient", role: "patient" },
  { name: "character-student", role: "student" },
  { name: "character-manager", role: "manager" },
  { name: "character-mentor", role: "mentor" },
];

const badges = [
  { name: "badge-beginner", label: "beginner", tier: 1 },
  { name: "badge-apprentice", label: "apprentice", tier: 2 },
  { name: "badge-strategist", label: "strategist", tier: 3 },
  { name: "badge-master", label: "master", tier: 4 },
  { name: "icon-xp-star", label: "star", tier: 0 },
  { name: "celebration-level-up", label: "celebrate", tier: 5 },
];

const scenes = [
  { name: "story-law-client-office", scene: "law-client-office" },
  { name: "story-law-courtroom", scene: "law-courtroom" },
  { name: "story-law-advice", scene: "law-advice" },
  { name: "story-medicine-clinic", scene: "medicine-clinic" },
  { name: "story-engineering-lab", scene: "engineering-lab" },
  { name: "story-economics-policy", scene: "economics-policy" },
  { name: "story-classroom-mentor", scene: "classroom-mentor" },
];

const demos = [
  { name: "demo-hero", scene: "demo-hero" },
  { name: "demo-pipeline", scene: "demo-pipeline" },
  { name: "demo-readiness-ring", scene: "demo-ring" },
  { name: "demo-feature-strip", scene: "demo-feature-strip" },
];

const landing = [
  { name: "landing-hero", scene: "landing-hero" },
  { name: "landing-discipline-cards", scene: "landing-cards" },
  { name: "landing-timeline", scene: "landing-timeline" },
];

const empties = [
  { name: "empty-uploads", scene: "empty-uploads" },
  { name: "empty-wiki", scene: "empty-wiki" },
  { name: "empty-notes", scene: "empty-notes" },
  { name: "empty-key-points", scene: "empty-key-points" },
  { name: "empty-flashcards", scene: "empty-flashcards" },
  { name: "empty-quiz", scene: "empty-quiz" },
  { name: "empty-report", scene: "empty-report" },
];

function esc(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function svgShell(width, height, content, { transparent = true, defs = "" } = {}) {
  const background = transparent ? "" : `<rect width="100%" height="100%" fill="${palette.ivory}"/>`;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none">
  <defs>
    <linearGradient id="bgWarm" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#FFF9EE"/>
      <stop offset="100%" stop-color="#F1E7D0"/>
    </linearGradient>
    <linearGradient id="bgCool" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#F7FAFF"/>
      <stop offset="100%" stop-color="#E8F0FF"/>
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="45%" r="55%">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.88"/>
      <stop offset="100%" stop-color="#FFFFFF" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="shadowFade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${palette.softShadow}" stop-opacity="0.55"/>
      <stop offset="100%" stop-color="${palette.softShadow}" stop-opacity="0"/>
    </linearGradient>
    <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="16" stdDeviation="18" flood-color="${palette.ink}" flood-opacity="0.18"/>
    </filter>
    <filter id="innerGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="0" stdDeviation="10" flood-color="#FFFFFF" flood-opacity="0.5"/>
    </filter>
    ${defs}
  </defs>
  ${background}
  ${content}
</svg>`;
}

function roundRect(x, y, w, h, r, fill, extra = "") {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" ${extra}/>`;
}

function circle(cx, cy, r, fill, extra = "") {
  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" ${extra}/>`;
}

function subjectColors(subject) {
  switch (subject) {
    case "law":
      return { main: palette.violet, deep: palette.indigo, accent: palette.paper, light: "#ECE7FF" };
    case "engineering":
      return { main: palette.blue, deep: palette.blueDeep, accent: "#E7F0FF", light: "#EDF4FF" };
    case "medicine":
      return { main: palette.green, deep: palette.greenDeep, accent: "#E2F7EF", light: "#EEF9F5" };
    case "economics":
      return { main: palette.amber, deep: palette.amberDeep, accent: "#FFF1D9", light: "#FFF6E8" };
    default:
      return { main: palette.steel, deep: palette.slate, accent: "#EEF2F7", light: "#F4F6FA" };
  }
}

function roleAccent(role) {
  switch (role) {
    case "client":
      return { main: palette.violet, deep: palette.indigo, prop: "folder" };
    case "patient":
      return { main: palette.green, deep: palette.greenDeep, prop: "stethoscope" };
    case "student":
      return { main: palette.blue, deep: palette.blueDeep, prop: "book" };
    case "manager":
      return { main: palette.amber, deep: palette.amberDeep, prop: "tablet" };
    case "mentor":
      return { main: palette.steel, deep: palette.ink, prop: "lamp" };
    default:
      return { main: palette.steel, deep: palette.ink, prop: "book" };
  }
}

function avatarBase({ theme = "neutral", mood = "calm", accessory = "book" } = {}) {
  const colors = subjectColors(theme === "neutral" ? "neutral" : theme);
  const hair = theme === "success" ? palette.goldDark : colors.deep;
  const shirt = theme === "beginner" ? "#F0F4FF" : theme === "advanced" ? "#EEF2F9" : palette.ivory;
  const jacket = theme === "success" ? palette.gold : colors.main;
  const skin = palette.skin;
  const skinDeep = palette.skinDeep;

  const mouth = {
    calm: `M 485 414 C 505 430 527 430 547 414`,
    smile: `M 480 412 C 506 438 528 438 554 412`,
    soft: `M 484 416 C 506 428 526 428 548 416`,
    confident: `M 476 410 C 505 436 530 436 558 410`,
  }[mood] ?? `M 485 414 C 505 430 527 430 547 414`;

  const brows = mood === "confident"
    ? `<path d="M 438 352 C 455 342 473 342 490 352" stroke="${palette.ink}" stroke-width="10" stroke-linecap="round"/><path d="M 526 352 C 543 342 561 342 578 352" stroke="${palette.ink}" stroke-width="10" stroke-linecap="round"/>`
    : `<path d="M 438 350 C 454 345 472 345 488 350" stroke="${palette.ink}" stroke-width="9" stroke-linecap="round"/><path d="M 528 350 C 544 345 562 345 578 350" stroke="${palette.ink}" stroke-width="9" stroke-linecap="round"/>`;

  const prop = accessorySvg(accessory, colors, theme);

  return `
    <g filter="url(#softShadow)">
      <circle cx="512" cy="392" r="196" fill="url(#glow)" opacity="0.72"/>
      <circle cx="512" cy="392" r="170" fill="${colors.light}" opacity="0.55"/>
      <path d="M 406 702 C 413 596 431 510 470 451 C 488 422 535 414 556 430 C 623 479 650 586 660 702 Z" fill="${jacket}"/>
      <path d="M 452 451 C 436 479 423 514 417 560 C 458 583 463 607 468 702 H 556 C 560 609 566 582 605 560 C 598 514 586 478 571 451 Z" fill="${shirt}"/>
      <path d="M 469 455 C 488 481 504 500 512 500 C 520 500 536 481 555 455" stroke="${palette.ink}" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M 445 463 C 417 523 400 615 392 702 H 448 C 458 604 469 524 487 480 C 472 470 459 466 445 463 Z" fill="${colors.deep}" opacity="0.45"/>
      <path d="M 579 463 C 607 523 624 615 632 702 H 576 C 566 604 555 524 537 480 C 552 470 565 466 579 463 Z" fill="${colors.deep}" opacity="0.45"/>
      <circle cx="462" cy="390" r="110" fill="${skin}"/>
      <path d="M 360 390 C 370 304 427 255 511 255 C 590 255 644 300 656 380 C 648 308 611 276 551 258 C 493 240 426 253 381 297 C 359 318 348 350 360 390 Z" fill="${hair}"/>
      <path d="M 369 357 C 391 318 434 288 487 286 C 448 305 424 343 412 394 C 400 428 389 457 373 481 C 359 441 356 396 369 357 Z" fill="${hair}" opacity="0.95"/>
      <path d="M 631 357 C 609 318 566 288 513 286 C 552 305 576 343 588 394 C 600 428 611 457 627 481 C 641 441 644 396 631 357 Z" fill="${hair}" opacity="0.95"/>
      <ellipse cx="448" cy="410" rx="11" ry="14" fill="${palette.ink}"/>
      <ellipse cx="536" cy="410" rx="11" ry="14" fill="${palette.ink}"/>
      <circle cx="445" cy="406" r="3" fill="#FFFFFF"/>
      <circle cx="533" cy="406" r="3" fill="#FFFFFF"/>
      ${brows}
      <path d="${mouth}" stroke="${palette.ink}" stroke-width="10" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      <path d="M 416 438 C 441 462 477 478 512 478 C 548 478 584 462 609 438 C 592 492 557 529 512 532 C 468 529 432 492 416 438 Z" fill="${skinDeep}" opacity="0.16"/>
      <path d="M 399 562 C 437 601 480 620 512 620 C 545 620 588 601 625 562" stroke="${palette.ivory}" stroke-width="20" stroke-linecap="round" opacity="0.34"/>
      ${prop}
    </g>
  `;
}

function accessorySvg(accessory, colors) {
  switch (accessory) {
    case "folder":
      return `
        <g transform="translate(606 460) rotate(8)">
          <rect x="-70" y="-30" width="110" height="74" rx="14" fill="${colors.deep}"/>
          <rect x="-80" y="-44" width="68" height="28" rx="10" fill="${colors.main}"/>
          <rect x="-56" y="-16" width="84" height="6" rx="3" fill="#FFFFFF" opacity="0.4"/>
        </g>`;
    case "hardhat":
      return `
        <g transform="translate(616 460) rotate(6)">
          <path d="M -66 6 C -66 -31 -35 -57 0 -57 C 35 -57 66 -31 66 6 V 18 H -66 Z" fill="${colors.main}"/>
          <path d="M -52 6 C -49 -18 -22 -37 0 -37 C 22 -37 49 -18 52 6" stroke="#FFFFFF" stroke-width="10" stroke-linecap="round" opacity="0.56"/>
          <rect x="-70" y="10" width="140" height="18" rx="9" fill="${colors.deep}"/>
        </g>`;
    case "stethoscope":
      return `
        <g transform="translate(610 456)">
          <path d="M -18 -42 V 14 C -18 38 -38 58 -62 58 C -86 58 -106 38 -106 14" stroke="${colors.main}" stroke-width="12" stroke-linecap="round" fill="none"/>
          <path d="M 16 -42 V 14 C 16 38 36 58 60 58 C 84 58 104 38 104 14" stroke="${colors.main}" stroke-width="12" stroke-linecap="round" fill="none"/>
          <circle cx="-62" cy="58" r="17" fill="${colors.deep}"/>
          <circle cx="60" cy="58" r="17" fill="${colors.deep}"/>
          <circle cx="0" cy="-42" r="16" fill="${colors.main}"/>
          <circle cx="0" cy="-42" r="7" fill="#FFFFFF" opacity="0.7"/>
        </g>`;
    case "charts":
      return `
        <g transform="translate(612 456)">
          <path d="M -64 44 V -12" stroke="${colors.deep}" stroke-width="16" stroke-linecap="round"/>
          <path d="M -28 44 V 12" stroke="${colors.main}" stroke-width="16" stroke-linecap="round"/>
          <path d="M 8 44 V -34" stroke="${colors.deep}" stroke-width="16" stroke-linecap="round"/>
          <path d="M 44 44 V -2" stroke="${colors.main}" stroke-width="16" stroke-linecap="round"/>
          <path d="M -78 52 H 70" stroke="#FFFFFF" stroke-width="12" stroke-linecap="round" opacity="0.5"/>
          <circle cx="-64" cy="-12" r="12" fill="${colors.main}"/>
          <circle cx="-28" cy="12" r="12" fill="${colors.deep}"/>
          <circle cx="8" cy="-34" r="12" fill="${colors.main}"/>
          <circle cx="44" cy="-2" r="12" fill="${colors.deep}"/>
        </g>`;
    case "badge":
      return `
        <g transform="translate(608 454)">
          <path d="M 0 -68 L 50 -40 L 50 20 C 50 60 17 90 0 98 C -17 90 -50 60 -50 20 V -40 Z" fill="${colors.main}"/>
          <circle cx="0" cy="-6" r="34" fill="${palette.ivory}" opacity="0.94"/>
          <path d="M -14 -8 L -2 6 L 18 -18" stroke="${colors.deep}" stroke-width="12" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
        </g>`;
    case "tablet":
      return `
        <g transform="translate(612 460) rotate(7)">
          <rect x="-64" y="-48" width="128" height="150" rx="18" fill="${colors.deep}"/>
          <rect x="-48" y="-30" width="96" height="112" rx="10" fill="${palette.ivory}" opacity="0.95"/>
          <path d="M -30 -6 H 28" stroke="${colors.main}" stroke-width="12" stroke-linecap="round"/>
          <path d="M -30 22 H 40" stroke="${colors.deep}" stroke-width="12" stroke-linecap="round" opacity="0.7"/>
        </g>`;
    case "lamp":
      return `
        <g transform="translate(610 454)">
          <path d="M 0 -92 V -34" stroke="${colors.main}" stroke-width="12" stroke-linecap="round"/>
          <path d="M -52 -34 H 52 L 30 14 H -30 Z" fill="${colors.deep}"/>
          <path d="M -18 14 H 18 V 50 H -18 Z" fill="${colors.main}"/>
          <circle cx="0" cy="72" r="20" fill="${palette.gold}"/>
        </g>`;
    case "book":
    default:
      return `
        <g transform="translate(610 460) rotate(8)">
          <path d="M -78 -44 H -6 C 12 -44 28 -36 28 -20 V 60 C 12 48 0 46 -18 46 H -78 Z" fill="${colors.main}"/>
          <path d="M 0 -44 H 72 V 46 H 18 C 0 46 -12 48 -28 60 V -20 C -28 -36 -12 -44 0 -44 Z" fill="${colors.deep}"/>
          <path d="M -50 -4 H -12" stroke="#FFFFFF" stroke-width="10" stroke-linecap="round" opacity="0.5"/>
          <path d="M 18 2 H 58" stroke="#FFFFFF" stroke-width="10" stroke-linecap="round" opacity="0.5"/>
        </g>`;
  }
}

function guideAvatar(variant) {
  let theme = "neutral";
  let mood = "calm";
  let accessory = "book";
  let ring = palette.steel;
  let halo = "#F5F8FF";
  let jacket = palette.steel;
  let badge = "";

  switch (variant) {
    case "demo":
      theme = "neutral";
      mood = "confident";
      accessory = "tablet";
      ring = palette.ink;
      halo = "#FFF6E9";
      jacket = palette.indigo;
      badge = circle(512, 196, 42, palette.gold, `opacity="0.92"`);
      break;
    case "beginner":
      theme = "beginner";
      mood = "soft";
      accessory = "book";
      ring = palette.blue;
      halo = "#F5F9FF";
      jacket = "#7D96D9";
      badge = circle(512, 190, 36, palette.blue, `opacity="0.84"`);
      break;
    case "advanced":
      theme = "advanced";
      mood = "confident";
      accessory = "charts";
      ring = palette.indigo;
      halo = "#F4F1FF";
      jacket = palette.indigo;
      badge = circle(512, 190, 38, palette.violet, `opacity="0.78"`);
      break;
    case "success":
      theme = "success";
      mood = "smile";
      accessory = "book";
      ring = palette.gold;
      halo = "#FFF6DF";
      jacket = palette.gold;
      badge = star(512, 190, 36, palette.gold);
      break;
    case "law":
      theme = "law";
      mood = "confident";
      accessory = "folder";
      ring = palette.violet;
      halo = "#F5F0FF";
      jacket = palette.violet;
      badge = lawBadge(512, 190);
      break;
    case "engineering":
      theme = "engineering";
      mood = "confident";
      accessory = "hardhat";
      ring = palette.blue;
      halo = "#F0F7FF";
      jacket = palette.blue;
      badge = engineeringBadge(512, 190);
      break;
    case "medicine":
      theme = "medicine";
      mood = "soft";
      accessory = "stethoscope";
      ring = palette.green;
      halo = "#EFFAF5";
      jacket = palette.green;
      badge = medicineBadge(512, 190);
      break;
    case "economics":
      theme = "economics";
      mood = "confident";
      accessory = "charts";
      ring = palette.amber;
      halo = "#FFF7E7";
      jacket = palette.amber;
      badge = economicsBadge(512, 190);
      break;
    default:
      theme = "neutral";
      mood = "calm";
      accessory = "book";
      ring = palette.steel;
      halo = "#F5F7FB";
      jacket = palette.steel;
      badge = neutralBadge(512, 190);
      break;
  }

  const outfitTint = theme === "success" ? palette.gold : jacket;

  return svgShell(
    1024,
    1024,
    `
    <g>
      <circle cx="512" cy="472" r="326" fill="${halo}" opacity="0.86"/>
      <circle cx="512" cy="484" r="278" fill="url(#glow)" opacity="0.76"/>
      <circle cx="512" cy="488" r="292" fill="none" stroke="${ring}" stroke-width="18" opacity="0.14"/>
      <circle cx="512" cy="486" r="240" fill="#FFFFFF" opacity="0.58" filter="url(#innerGlow)"/>
      ${badge}
      ${avatarBase({ theme, mood, accessory })}
      <path d="M 304 714 C 365 670 439 646 512 646 C 585 646 659 670 720 714" stroke="${outfitTint}" stroke-width="16" stroke-linecap="round" opacity="0.18"/>
    </g>`,
  );
}

function lawBadge(cx, cy) {
  return `
    <g transform="translate(${cx} ${cy})">
      <path d="M 0 -52 L 52 -22 L 38 40 H -38 L -52 -22 Z" fill="${palette.violet}" opacity="0.92"/>
      <path d="M -18 -2 H 18" stroke="#FFFFFF" stroke-width="11" stroke-linecap="round"/>
      <path d="M 0 -32 V 24" stroke="#FFFFFF" stroke-width="11" stroke-linecap="round"/>
    </g>`;
}

function engineeringBadge(cx, cy) {
  return `
    <g transform="translate(${cx} ${cy})">
      <rect x="-50" y="-50" width="100" height="100" rx="26" fill="${palette.blue}" opacity="0.92"/>
      <path d="M -22 18 L 6 -16 L 18 -4 L 38 -30" stroke="#FFFFFF" stroke-width="11" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      <circle cx="-18" cy="22" r="8" fill="#FFFFFF"/>
      <circle cx="38" cy="-30" r="8" fill="#FFFFFF"/>
    </g>`;
}

function medicineBadge(cx, cy) {
  return `
    <g transform="translate(${cx} ${cy})">
      <path d="M 0 -54 C 22 -54 48 -34 48 -8 C 48 28 18 54 0 70 C -18 54 -48 28 -48 -8 C -48 -34 -22 -54 0 -54 Z" fill="${palette.green}" opacity="0.92"/>
      <path d="M -20 -8 H 20" stroke="#FFFFFF" stroke-width="11" stroke-linecap="round"/>
      <path d="M 0 -28 V 12" stroke="#FFFFFF" stroke-width="11" stroke-linecap="round"/>
    </g>`;
}

function economicsBadge(cx, cy) {
  return `
    <g transform="translate(${cx} ${cy})">
      <circle cx="0" cy="0" r="54" fill="${palette.amber}" opacity="0.92"/>
      <path d="M -24 24 L -8 8 L 8 16 L 28 -10" stroke="#FFFFFF" stroke-width="11" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      <circle cx="-24" cy="24" r="8" fill="#FFFFFF"/>
      <circle cx="28" cy="-10" r="8" fill="#FFFFFF"/>
    </g>`;
}

function neutralBadge(cx, cy) {
  return `
    <g transform="translate(${cx} ${cy})">
      <circle cx="0" cy="0" r="54" fill="${palette.steel}" opacity="0.9"/>
      <circle cx="0" cy="0" r="24" fill="#FFFFFF" opacity="0.95"/>
    </g>`;
}

function star(cx, cy, r, fill) {
  const points = [];
  const outer = r;
  const inner = r * 0.46;
  for (let i = 0; i < 10; i += 1) {
    const angle = -Math.PI / 2 + (Math.PI / 5) * i;
    const radius = i % 2 === 0 ? outer : inner;
    points.push(`${cx + Math.cos(angle) * radius},${cy + Math.sin(angle) * radius}`);
  }
  return `<polygon points="${points.join(" ")}" fill="${fill}" opacity="0.94"/>`;
}

function characterPortrait(role) {
  const accent = roleAccent(role);
  const accessoryByRole = {
    client: "folder",
    patient: "stethoscope",
    student: "book",
    manager: "tablet",
    mentor: "lamp",
  };
  const accessory = accessoryByRole[role] ?? "book";
  const shirt = {
    client: "#FFF4EA",
    patient: "#F0FBF5",
    student: "#EEF3FF",
    manager: "#FFF5E4",
    mentor: "#F5F6FA",
  }[role] ?? palette.ivory;
  const faceGlare = role === "mentor" ? 0.5 : 0.42;

  return svgShell(
    1024,
    1024,
    `
      <g>
        <circle cx="512" cy="476" r="334" fill="${accent.main}" opacity="0.11"/>
        <circle cx="512" cy="476" r="286" fill="${accent.main}" opacity="0.08"/>
        <circle cx="512" cy="520" r="250" fill="#FFFFFF" opacity="0.72" filter="url(#softShadow)"/>
        <path d="M 300 770 C 312 641 370 548 462 506 C 488 494 536 494 562 506 C 654 548 712 641 724 770 Z" fill="${accent.main}" opacity="0.9"/>
        <path d="M 362 515 C 421 470 470 458 512 458 C 554 458 603 470 662 515 C 640 574 596 620 512 627 C 428 620 384 574 362 515 Z" fill="${shirt}"/>
        <circle cx="512" cy="418" r="112" fill="${palette.skin}"/>
        <path d="M 372 424 C 374 334 430 270 512 270 C 590 270 650 319 660 402 C 635 302 585 254 512 248 C 432 251 382 306 360 382 C 356 398 357 410 372 424 Z" fill="${accent.deep}"/>
        <ellipse cx="470" cy="419" rx="11" ry="14" fill="${palette.ink}"/>
        <ellipse cx="554" cy="419" rx="11" ry="14" fill="${palette.ink}"/>
        <path d="M 446 351 C 458 345 474 345 486 351" stroke="${palette.ink}" stroke-width="9" stroke-linecap="round"/>
        <path d="M 538 351 C 550 345 566 345 578 351" stroke="${palette.ink}" stroke-width="9" stroke-linecap="round"/>
        <path d="M 488 419 C 504 429 520 429 536 419" stroke="${palette.ink}" stroke-width="9" stroke-linecap="round"/>
        <path d="M 490 443 C 505 450 518 450 533 443" stroke="${palette.ink}" stroke-width="9" stroke-linecap="round"/>
        <path d="M 423 450 C 451 480 484 494 512 494 C 541 494 574 480 602 450" stroke="${palette.skinDeep}" stroke-width="18" stroke-linecap="round" opacity="${faceGlare}"/>
        ${accessorySvg(accessory, accent, role)}
      </g>`,
  );
}

function badgeAsset(kind, tier) {
  const colors = [
    { main: palette.blue, deep: palette.blueDeep, glow: "#EDF5FF" },
    { main: palette.violet, deep: palette.indigo, glow: "#F4EFFF" },
    { main: palette.amber, deep: palette.amberDeep, glow: "#FFF5E1" },
    { main: palette.gold, deep: palette.goldDark, glow: "#FFF9E8" },
  ][Math.max(0, Math.min(tier - 1, 3))];

  const symbol = {
    beginner: `<path d="M 0 -54 L 14 -18 L 52 -18 L 21 4 L 33 42 L 0 20 L -33 42 L -21 4 L -52 -18 L -14 -18 Z" fill="${palette.ivory}"/>`,
    apprentice: `<path d="M -22 28 H 22" stroke="${palette.ivory}" stroke-width="14" stroke-linecap="round"/><path d="M 0 -34 V 22" stroke="${palette.ivory}" stroke-width="14" stroke-linecap="round"/>`,
    strategist: `<path d="M -38 18 C -8 -10 8 -10 38 18" stroke="${palette.ivory}" stroke-width="14" stroke-linecap="round" fill="none"/><circle cx="-26" cy="10" r="8" fill="${palette.ivory}"/><circle cx="0" cy="-4" r="8" fill="${palette.ivory}"/><circle cx="26" cy="10" r="8" fill="${palette.ivory}"/>`,
    master: `<path d="M -38 18 L -8 -10 L 8 6 L 38 -26" stroke="${palette.ivory}" stroke-width="14" stroke-linecap="round" stroke-linejoin="round" fill="none"/><circle cx="-38" cy="18" r="8" fill="${palette.ivory}"/><circle cx="-8" cy="-10" r="8" fill="${palette.ivory}"/><circle cx="8" cy="6" r="8" fill="${palette.ivory}"/><circle cx="38" cy="-26" r="8" fill="${palette.ivory}"/>`,
    star: star(0, 0, 56, palette.ivory),
    celebrate: `<path d="M -50 36 C -28 6 -10 -6 0 -18 C 10 -6 28 6 50 36" stroke="${palette.ivory}" stroke-width="14" stroke-linecap="round" fill="none"/><path d="M -24 28 L 0 -4 L 24 28" stroke="${palette.ivory}" stroke-width="14" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`,
  }[kind];

  const shell = {
    beginner: `<path d="M 0 -82 L 66 -42 L 50 40 C 42 80 14 102 0 110 C -14 102 -42 80 -50 40 L -66 -42 Z" fill="${colors.main}"/>`,
    apprentice: `<path d="M 0 -86 L 70 -40 L 54 42 C 44 82 14 106 0 116 C -14 106 -44 82 -54 42 L -70 -40 Z" fill="${colors.main}"/>`,
    strategist: `<path d="M 0 -88 L 74 -38 L 58 46 C 46 92 16 114 0 124 C -16 114 -46 92 -58 46 L -74 -38 Z" fill="${colors.main}"/>`,
    master: `<path d="M 0 -94 L 78 -42 L 62 50 C 48 100 16 124 0 136 C -16 124 -48 100 -62 50 L -78 -42 Z" fill="${colors.main}"/>`,
    star: `<circle cx="0" cy="0" r="82" fill="${colors.main}"/>`,
    celebrate: `<path d="M 0 -100 L 82 -50 L 66 54 C 54 104 18 132 0 146 C -18 132 -54 104 -66 54 L -82 -50 Z" fill="${colors.main}"/>`,
  }[kind];

  const aura = {
    beginner: `<circle cx="0" cy="0" r="140" fill="${colors.glow}" opacity="0.9"/>`,
    apprentice: `<circle cx="0" cy="0" r="144" fill="${colors.glow}" opacity="0.92"/>`,
    strategist: `<circle cx="0" cy="0" r="148" fill="${colors.glow}" opacity="0.94"/>`,
    master: `<circle cx="0" cy="0" r="154" fill="${colors.glow}" opacity="0.96"/>`,
    star: `<circle cx="0" cy="0" r="132" fill="${colors.glow}" opacity="0.92"/>`,
    celebrate: `<circle cx="0" cy="0" r="156" fill="${colors.glow}" opacity="0.96"/>`,
  }[kind];

  return svgShell(
    1024,
    1024,
    `
      <g transform="translate(512 512)">
        ${aura}
        ${shell}
        <g filter="url(#softShadow)">
          <circle cx="0" cy="0" r="80" fill="${palette.ivory}" opacity="0.95"/>
          ${symbol}
        </g>
        ${kind === "celebrate" ? `<circle cx="-116" cy="-64" r="16" fill="${palette.violet}"/><circle cx="112" cy="-88" r="16" fill="${palette.green}"/><circle cx="-104" cy="90" r="16" fill="${palette.amber}"/><circle cx="128" cy="84" r="16" fill="${palette.blue}"/>` : ""}
      </g>`,
  );
}

function starBadge() {
  return svgShell(
    1024,
    1024,
    `
      <g transform="translate(512 512)">
        <circle cx="0" cy="0" r="170" fill="#FFF6D9" opacity="0.9"/>
        <circle cx="0" cy="0" r="130" fill="${palette.gold}" opacity="0.95"/>
        ${star(0, 0, 74, palette.ivory)}
        <path d="M -122 -28 L -94 -12" stroke="${palette.goldDark}" stroke-width="12" stroke-linecap="round"/>
        <path d="M 122 -28 L 94 -12" stroke="${palette.goldDark}" stroke-width="12" stroke-linecap="round"/>
      </g>`,
  );
}

function sceneSvg(kind) {
  const W = 1536;
  const H = 1024;
  const subject = kind.startsWith("law") ? "law" : kind.startsWith("medicine") ? "medicine" : kind.startsWith("engineering") ? "engineering" : kind.startsWith("economics") ? "economics" : "neutral";
  const colors = subjectColors(subject);
  const bg = {
    law: "url(#bgWarm)",
    engineering: "url(#bgCool)",
    medicine: "url(#bgCool)",
    economics: "url(#bgWarm)",
    neutral: "url(#bgWarm)",
  }[subject];

  const room = roomScene(kind, colors);
  return svgShell(
    W,
    H,
    `
      <rect width="100%" height="100%" fill="${bg}"/>
      <circle cx="350" cy="250" r="220" fill="${colors.main}" opacity="0.10"/>
      <circle cx="1260" cy="260" r="260" fill="${colors.deep}" opacity="0.08"/>
      <circle cx="1210" cy="790" r="250" fill="${colors.main}" opacity="0.08"/>
      ${room}
    `,
    { transparent: false },
  );
}

function roomScene(kind, colors) {
  const subject = kind.startsWith("law")
    ? "law"
    : kind.startsWith("medicine")
      ? "medicine"
      : kind.startsWith("engineering")
        ? "engineering"
        : kind.startsWith("economics")
          ? "economics"
          : "neutral";
  const panel = (x, y, w, h, fill, opacity = 1) => roundRect(x, y, w, h, 36, fill, `opacity="${opacity}" filter="url(#softShadow)"`);
  const chartBars = `
    <g transform="translate(1120 230)">
      <rect x="0" y="0" width="248" height="190" rx="28" fill="#FFFFFF" opacity="0.88" filter="url(#softShadow)"/>
      <path d="M 24 150 H 214" stroke="${palette.steel}" stroke-width="10" stroke-linecap="round" opacity="0.6"/>
      <path d="M 58 150 V 88" stroke="${colors.main}" stroke-width="18" stroke-linecap="round"/>
      <path d="M 112 150 V 52" stroke="${colors.deep}" stroke-width="18" stroke-linecap="round"/>
      <path d="M 166 150 V 102" stroke="${colors.main}" stroke-width="18" stroke-linecap="round"/>
    </g>`;

  const desk = `
    <g transform="translate(140 712)">
      <rect x="0" y="0" width="1256" height="160" rx="44" fill="${palette.ivory}" opacity="0.92" filter="url(#softShadow)"/>
      <rect x="48" y="26" width="1160" height="110" rx="30" fill="${colors.main}" opacity="0.08"/>
      <path d="M 120 124 C 258 84 386 78 512 102 C 640 126 770 130 912 96 C 1028 70 1134 68 1188 90" stroke="${colors.deep}" stroke-width="16" stroke-linecap="round" opacity="0.18"/>
    </g>`;

  const student = portraitGroup(485, 480, 1.05, colors.main, colors.deep, "student");
  const client = portraitGroup(1040, 500, 1.02, subject === "law" ? palette.violet : colors.main, colors.deep, subject === "medicine" ? "patient" : "client");
  const mentor = portraitGroup(310, 490, 0.96, colors.deep, colors.main, kind.includes("mentor") ? "mentor" : "manager");
  const extras = sceneExtras(kind, colors);

  return `
    <g>
      <rect x="132" y="140" width="1270" height="736" rx="54" fill="#FFFFFF" opacity="0.4"/>
      ${chartBars}
      <g opacity="0.92">
        <path d="M 216 208 C 260 156 326 124 402 118 H 996 C 1106 118 1196 168 1254 248" stroke="${colors.main}" stroke-width="18" stroke-linecap="round" opacity="0.22"/>
      </g>
      ${panel(166, 170, 1190, 640, "#FFFFFF", 0.48)}
      ${desk}
      ${student}
      ${client}
      ${mentor}
      ${extras}
    </g>
  `;
}

function portraitGroup(x, y, scale, main, deep, role) {
  const prop = {
    client: "folder",
    patient: "stethoscope",
    student: "book",
    manager: "tablet",
    mentor: "lamp",
  }[role] ?? "book";
  return `
    <g transform="translate(${x} ${y}) scale(${scale})">
      <circle cx="0" cy="0" r="176" fill="${main}" opacity="0.10"/>
      <circle cx="0" cy="0" r="144" fill="#FFFFFF" opacity="0.76" filter="url(#softShadow)"/>
      <path d="M -108 132 C -102 34 -58 -34 0 -54 C 58 -34 102 34 108 132 Z" fill="${deep}" opacity="0.92"/>
      <path d="M -70 -4 C -54 -84 -10 -126 0 -126 C 10 -126 54 -84 70 -4 C 56 -8 42 -12 0 -12 C -42 -12 -56 -8 -70 -4 Z" fill="${main}"/>
      <circle cx="0" cy="-42" r="94" fill="${palette.skin}"/>
      <ellipse cx="-28" cy="-30" rx="8" ry="11" fill="${palette.ink}"/>
      <ellipse cx="28" cy="-30" rx="8" ry="11" fill="${palette.ink}"/>
      <path d="M -28 -58 C -18 -62 -10 -62 0 -58" stroke="${palette.ink}" stroke-width="6" stroke-linecap="round"/>
      <path d="M 0 -58 C 10 -62 18 -62 28 -58" stroke="${palette.ink}" stroke-width="6" stroke-linecap="round"/>
      <path d="M -10 -18 C -2 -12 2 -12 10 -18" stroke="${palette.ink}" stroke-width="6" stroke-linecap="round"/>
      <path d="M -26 6 C -10 18 10 18 26 6" stroke="${palette.ink}" stroke-width="6" stroke-linecap="round"/>
      <g transform="translate(92 36)">
        ${accessorySvg(prop, { main, deep }, role)}
      </g>
    </g>`;
}

function sceneExtras(kind, colors) {
  switch (kind) {
    case "law-client-office":
      return `
        <g transform="translate(126 220)">
          <rect x="0" y="0" width="280" height="280" rx="34" fill="#FFFFFF" opacity="0.82" filter="url(#softShadow)"/>
          <path d="M 40 76 H 240" stroke="${colors.main}" stroke-width="14" stroke-linecap="round" opacity="0.5"/>
          <path d="M 40 120 H 180" stroke="${colors.deep}" stroke-width="14" stroke-linecap="round" opacity="0.4"/>
          <path d="M 40 164 H 220" stroke="${colors.main}" stroke-width="14" stroke-linecap="round" opacity="0.4"/>
          <path d="M 40 208 H 160" stroke="${colors.deep}" stroke-width="14" stroke-linecap="round" opacity="0.4"/>
          <path d="M 214 58 L 244 92 L 236 104 L 206 70 Z" fill="${colors.main}"/>
          <path d="M 206 70 L 236 104 L 228 116 L 198 82 Z" fill="${colors.deep}"/>
        </g>`;
    case "law-courtroom":
      return `
        <g transform="translate(1020 196)">
          <rect x="0" y="0" width="380" height="170" rx="30" fill="${colors.deep}" opacity="0.16"/>
          <path d="M 42 120 H 338" stroke="${colors.main}" stroke-width="18" stroke-linecap="round"/>
          <path d="M 84 120 V 56 H 296 V 120" stroke="${colors.deep}" stroke-width="14" stroke-linecap="round" fill="none"/>
          <path d="M 102 56 L 190 16 L 278 56" stroke="${colors.main}" stroke-width="14" stroke-linecap="round" fill="none"/>
        </g>`;
    case "law-advice":
      return `
        <g transform="translate(1110 520)">
          <path d="M 0 0 C 30 -40 78 -64 122 -58" stroke="${colors.main}" stroke-width="14" stroke-linecap="round" fill="none"/>
          <path d="M 28 4 L 88 -30" stroke="${colors.deep}" stroke-width="14" stroke-linecap="round"/>
          <circle cx="136" cy="-62" r="42" fill="#FFFFFF" opacity="0.9" filter="url(#softShadow)"/>
          <path d="M 116 -64 H 156" stroke="${colors.main}" stroke-width="10" stroke-linecap="round"/>
        </g>`;
    case "medicine-clinic":
      return `
        <g transform="translate(1060 170)">
          <rect x="0" y="0" width="330" height="230" rx="32" fill="#FFFFFF" opacity="0.82" filter="url(#softShadow)"/>
          <path d="M 54 144 C 92 90 142 68 206 68 C 240 68 270 78 300 98" stroke="${colors.main}" stroke-width="16" stroke-linecap="round" fill="none"/>
          <circle cx="100" cy="96" r="18" fill="${colors.main}"/>
          <circle cx="196" cy="82" r="14" fill="${colors.deep}"/>
          <path d="M 238 156 C 238 130 258 110 284 110 C 310 110 330 130 330 156 C 330 190 284 214 284 214 C 284 214 238 190 238 156 Z" fill="${colors.deep}" opacity="0.8"/>
        </g>`;
    case "engineering-lab":
      return `
        <g transform="translate(1180 190)">
          <rect x="0" y="0" width="270" height="260" rx="34" fill="#FFFFFF" opacity="0.8" filter="url(#softShadow)"/>
          <path d="M 56 198 H 220" stroke="${colors.deep}" stroke-width="14" stroke-linecap="round" opacity="0.36"/>
          <path d="M 56 150 L 94 110 L 132 150 L 176 74 L 212 126" stroke="${colors.main}" stroke-width="16" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
          <circle cx="176" cy="74" r="12" fill="${colors.deep}"/>
          <path d="M 206 72 L 236 42" stroke="${palette.rose}" stroke-width="12" stroke-linecap="round"/>
          <path d="M 206 42 L 236 72" stroke="${palette.rose}" stroke-width="12" stroke-linecap="round"/>
        </g>`;
    case "economics-policy":
      return `
        <g transform="translate(1080 182)">
          <rect x="0" y="0" width="340" height="250" rx="34" fill="#FFFFFF" opacity="0.8" filter="url(#softShadow)"/>
          <path d="M 48 190 H 290" stroke="${colors.deep}" stroke-width="14" stroke-linecap="round" opacity="0.34"/>
          <path d="M 68 152 L 128 124 L 186 140 L 250 84" stroke="${colors.main}" stroke-width="16" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
          <circle cx="68" cy="152" r="12" fill="${colors.main}"/>
          <circle cx="128" cy="124" r="12" fill="${colors.deep}"/>
          <circle cx="186" cy="140" r="12" fill="${colors.main}"/>
          <circle cx="250" cy="84" r="12" fill="${colors.deep}"/>
          <path d="M 266 86 C 282 66 296 60 312 54" stroke="${colors.deep}" stroke-width="14" stroke-linecap="round" fill="none"/>
        </g>`;
    case "classroom-mentor":
      return `
        <g transform="translate(1040 204)">
          <rect x="0" y="0" width="348" height="222" rx="34" fill="#FFFFFF" opacity="0.8" filter="url(#softShadow)"/>
          <path d="M 54 168 H 292" stroke="${colors.main}" stroke-width="14" stroke-linecap="round" opacity="0.34"/>
          <path d="M 86 78 C 140 44 206 44 262 78" stroke="${colors.deep}" stroke-width="16" stroke-linecap="round" fill="none"/>
          <circle cx="176" cy="116" r="26" fill="${colors.main}" opacity="0.85"/>
          <circle cx="84" cy="96" r="14" fill="${colors.deep}"/>
          <circle cx="264" cy="96" r="14" fill="${colors.deep}"/>
        </g>`;
    case "demo-hero":
      return `
        <g transform="translate(150 170)">
          <rect x="0" y="0" width="1236" height="700" rx="56" fill="#FFFFFF" opacity="0.76" filter="url(#softShadow)"/>
          <path d="M 88 130 H 1150" stroke="${colors.main}" stroke-width="16" stroke-linecap="round" opacity="0.16"/>
          <path d="M 88 560 H 1150" stroke="${colors.deep}" stroke-width="16" stroke-linecap="round" opacity="0.16"/>
          <g transform="translate(120 220)">
            <rect x="0" y="0" width="280" height="220" rx="32" fill="${colors.main}" opacity="0.14"/>
            <rect x="36" y="36" width="208" height="36" rx="18" fill="${colors.main}" opacity="0.28"/>
            <rect x="36" y="92" width="164" height="36" rx="18" fill="${colors.deep}" opacity="0.22"/>
            <rect x="36" y="148" width="236" height="36" rx="18" fill="${colors.main}" opacity="0.20"/>
          </g>
          <g transform="translate(470 220)">
            <rect x="0" y="0" width="280" height="220" rx="32" fill="${palette.violet}" opacity="0.14"/>
            <circle cx="84" cy="82" r="38" fill="${palette.violet}" opacity="0.28"/>
            <circle cx="182" cy="120" r="34" fill="${palette.green}" opacity="0.22"/>
            <circle cx="214" cy="62" r="18" fill="${palette.gold}" opacity="0.38"/>
          </g>
          <g transform="translate(820 220)">
            <rect x="0" y="0" width="296" height="220" rx="32" fill="${colors.deep}" opacity="0.14"/>
            <path d="M 34 152 L 86 92 L 134 120 L 176 66 L 244 102" stroke="${colors.deep}" stroke-width="18" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
          </g>
        </g>`;
    case "demo-pipeline":
      return `
        <g transform="translate(160 170)">
          <rect x="0" y="0" width="1216" height="680" rx="48" fill="#FFFFFF" opacity="0.8" filter="url(#softShadow)"/>
          <path d="M 150 340 H 1048" stroke="${colors.deep}" stroke-width="18" stroke-linecap="round" opacity="0.18"/>
          ${pipelineNode(152, 340, colors.main, "Wiki")}
          ${pipelineNode(360, 340, colors.deep, "Notes")}
          ${pipelineNode(568, 340, colors.main, "PQ")}
          ${pipelineNode(776, 340, colors.deep, "Quiz")}
          ${pipelineNode(984, 340, palette.gold, "Report")}
        </g>`;
    case "demo-ring":
      return `
        <g transform="translate(512 512)">
          <circle cx="0" cy="0" r="264" fill="#FFFFFF" opacity="0.8" filter="url(#softShadow)"/>
          <circle cx="0" cy="0" r="190" fill="none" stroke="${colors.main}" stroke-width="58" stroke-linecap="round" stroke-dasharray="660 140"/>
          <circle cx="0" cy="0" r="116" fill="#FFFFFF" opacity="0.86"/>
          <path d="M -48 0 L -8 40 L 56 -24" stroke="${colors.deep}" stroke-width="20" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
          <circle cx="0" cy="-190" r="24" fill="${colors.main}"/>
        </g>`;
    case "demo-feature-strip":
      return `
        <g transform="translate(110 310)">
          <rect x="0" y="0" width="1316" height="376" rx="48" fill="#FFFFFF" opacity="0.84" filter="url(#softShadow)"/>
          ${featureChip(52, 80, "wiki", colors.main)}
          ${featureChip(224, 80, "notes", colors.deep)}
          ${featureChip(398, 80, "past questions", palette.violet)}
          ${featureChip(620, 80, "aoc", palette.amber)}
          ${featureChip(768, 80, "key points", colors.main)}
          ${featureChip(1028, 80, "flashcards", colors.deep)}
          ${featureChip(52, 212, "quiz", palette.green)}
          ${featureChip(242, 212, "report", palette.gold)}
          ${featureChip(430, 212, "readiness", palette.rose)}
        </g>`;
    case "landing-hero":
      return `
        <g transform="translate(126 126)">
          <rect x="0" y="0" width="1284" height="772" rx="58" fill="#FFFFFF" opacity="0.78" filter="url(#softShadow)"/>
          <circle cx="950" cy="252" r="180" fill="${colors.main}" opacity="0.12"/>
          <circle cx="250" cy="518" r="170" fill="${colors.deep}" opacity="0.10"/>
          <path d="M 132 566 C 320 430 500 388 688 408 C 852 425 980 376 1114 264" stroke="${colors.main}" stroke-width="22" stroke-linecap="round" fill="none" opacity="0.18"/>
          ${guideHeroCluster(colors)}
        </g>`;
    case "landing-cards":
      return `
        <g transform="translate(138 180)">
          <rect x="0" y="0" width="1260" height="640" rx="48" fill="#FFFFFF" opacity="0.8" filter="url(#softShadow)"/>
          ${disciplineCard(80, 90, "Law", palette.violet)}
          ${disciplineCard(370, 90, "Engineering", palette.blue)}
          ${disciplineCard(660, 90, "Medicine", palette.green)}
          ${disciplineCard(950, 90, "Economics", palette.amber)}
        </g>`;
    case "landing-timeline":
      return `
        <g transform="translate(136 164)">
          <rect x="0" y="0" width="1266" height="690" rx="48" fill="#FFFFFF" opacity="0.8" filter="url(#softShadow)"/>
          <path d="M 130 346 H 1116" stroke="${colors.deep}" stroke-width="18" stroke-linecap="round" opacity="0.16"/>
          ${timelineNode(170, 346, "Beginner", palette.blue)}
          ${timelineNode(452, 346, "Apprentice", palette.violet)}
          ${timelineNode(734, 346, "Strategist", palette.amber)}
          ${timelineNode(1016, 346, "Master", palette.gold)}
        </g>`;
    case "empty-uploads":
      return emptyScene("Upload files", colors.main, "cloud");
    case "empty-wiki":
      return emptyScene("Wiki", colors.deep, "book");
    case "empty-notes":
      return emptyScene("Notes", colors.main, "notebook");
    case "empty-key-points":
      return emptyScene("Key points", colors.deep, "bulb");
    case "empty-flashcards":
      return emptyScene("Flashcards", colors.main, "cards");
    case "empty-quiz":
      return emptyScene("Quiz", colors.deep, "quiz");
    case "empty-report":
      return emptyScene("Report", colors.main, "report");
    default:
      return "";
  }
}

function guideHeroCluster(colors) {
  return `
    <g transform="translate(214 180)">
      <rect x="0" y="0" width="1040" height="440" rx="44" fill="#FFFFFF" opacity="0.42" filter="url(#softShadow)"/>
      <g transform="translate(120 56)">
        ${miniCard(0, 0, 218, 238, colors.main)}
        ${miniCard(252, 16, 218, 238, colors.deep)}
        ${miniCard(504, 0, 218, 238, palette.violet)}
        ${miniCard(756, 16, 218, 238, palette.gold)}
      </g>
      <g transform="translate(358 82) scale(0.86)">
        ${avatarBase({ theme: "neutral", mood: "confident", accessory: "tablet" })}
      </g>
    </g>`;
}

function miniCard(x, y, w, h, color) {
  return `
    <g transform="translate(${x} ${y})">
      <rect x="0" y="0" width="${w}" height="${h}" rx="30" fill="${color}" opacity="0.14"/>
      <circle cx="${w / 2}" cy="${h / 2 - 18}" r="58" fill="#FFFFFF" opacity="0.88"/>
      <path d="M ${w / 2 - 34} ${h / 2 - 16} H ${w / 2 + 34}" stroke="${color}" stroke-width="12" stroke-linecap="round" opacity="0.8"/>
      <path d="M ${w / 2 - 18} ${h / 2 + 8} H ${w / 2 + 18}" stroke="${color}" stroke-width="12" stroke-linecap="round" opacity="0.8"/>
    </g>`;
}

function pipelineNode(x, y, color, label) {
  return `
    <g transform="translate(${x} ${y})">
      <circle cx="0" cy="0" r="62" fill="${color}" opacity="0.95"/>
      <circle cx="0" cy="0" r="86" fill="${color}" opacity="0.12"/>
      <path d="M -20 -4 L -2 16 L 22 -20" stroke="#FFFFFF" stroke-width="12" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      <rect x="-62" y="90" width="124" height="42" rx="21" fill="#FFFFFF" opacity="0.9"/>
      <text x="0" y="116" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="22" font-weight="700" fill="${palette.ink}">${esc(label)}</text>
    </g>`;
}

function featureChip(x, y, label, color) {
  const width = Math.max(110, label.length * 15 + 48);
  return `
    <g transform="translate(${x} ${y})">
      <rect x="0" y="0" width="${width}" height="84" rx="28" fill="${color}" opacity="0.14"/>
      <circle cx="38" cy="42" r="18" fill="${color}" opacity="0.88"/>
      <rect x="66" y="28" width="${width - 86}" height="10" rx="5" fill="${color}" opacity="0.58"/>
      <rect x="66" y="46" width="${Math.max(68, width - 112)}" height="10" rx="5" fill="${color}" opacity="0.38"/>
    </g>`;
}

function disciplineCard(x, y, title, color) {
  const prop = {
    Law: "folder",
    Engineering: "hardhat",
    Medicine: "stethoscope",
    Economics: "charts",
  }[title];
  return `
    <g transform="translate(${x} ${y})">
      <rect x="0" y="0" width="240" height="440" rx="38" fill="${color}" opacity="0.13"/>
      <circle cx="120" cy="116" r="82" fill="#FFFFFF" opacity="0.82"/>
      <g transform="translate(92 94)">
        ${accessorySvg(prop, subjectColors(title.toLowerCase()), title.toLowerCase())}
      </g>
      <rect x="38" y="238" width="164" height="18" rx="9" fill="${color}" opacity="0.6"/>
      <rect x="38" y="270" width="126" height="18" rx="9" fill="${color}" opacity="0.36"/>
      <rect x="38" y="324" width="164" height="64" rx="20" fill="#FFFFFF" opacity="0.7"/>
    </g>`;
}

function timelineNode(x, y, label, color) {
  return `
    <g transform="translate(${x} ${y})">
      <circle cx="0" cy="0" r="78" fill="${color}" opacity="0.14"/>
      <circle cx="0" cy="0" r="54" fill="${color}" opacity="0.9"/>
      <circle cx="0" cy="-76" r="18" fill="${color}" opacity="0.6"/>
      <rect x="-98" y="116" width="196" height="40" rx="20" fill="#FFFFFF" opacity="0.92"/>
      <text x="0" y="143" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="22" font-weight="700" fill="${palette.ink}">${esc(label)}</text>
    </g>`;
}

function emptyScene(kindLabel, color, iconType) {
  const icon = emptyIcon(iconType, color);
  return `
    <g transform="translate(128 160)">
      <rect x="0" y="0" width="1280" height="704" rx="54" fill="#FFFFFF" opacity="0.78" filter="url(#softShadow)"/>
      <circle cx="250" cy="240" r="180" fill="${color}" opacity="0.10"/>
      <circle cx="1040" cy="256" r="210" fill="${color}" opacity="0.08"/>
      <circle cx="810" cy="566" r="200" fill="${color}" opacity="0.08"/>
      <g transform="translate(640 282)">
        <circle cx="0" cy="0" r="154" fill="${color}" opacity="0.12"/>
        <circle cx="0" cy="0" r="118" fill="#FFFFFF" opacity="0.9"/>
        ${icon}
      </g>
      <rect x="420" y="516" width="440" height="24" rx="12" fill="${color}" opacity="0.32"/>
      <rect x="492" y="556" width="296" height="24" rx="12" fill="${color}" opacity="0.18"/>
      <text x="640" y="626" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="38" font-weight="800" fill="${palette.ink}">${esc(kindLabel)}</text>
    </g>`;
}

function emptyIcon(type, color) {
  switch (type) {
    case "cloud":
      return `<path d="M -80 54 H 82 C 112 54 138 30 138 0 C 138 -28 116 -50 86 -52 C 72 -90 38 -116 0 -116 C -48 -116 -88 -80 -96 -32 C -126 -28 -150 -2 -150 30 C -150 68 -120 98 -82 98 H -80 Z" fill="${color}" opacity="0.88"/>`;
    case "book":
      return `<path d="M -92 -72 H -4 C 12 -72 26 -66 38 -56 V 84 C 26 74 12 68 -4 68 H -92 Z" fill="${color}" opacity="0.88"/><path d="M 0 -72 H 88 V 68 H 4 C -12 68 -26 74 -38 84 V -56 C -26 -66 -12 -72 0 -72 Z" fill="${color}" opacity="0.72"/><path d="M -44 -14 H -10" stroke="#FFFFFF" stroke-width="10" stroke-linecap="round" opacity="0.7"/><path d="M 10 -14 H 46" stroke="#FFFFFF" stroke-width="10" stroke-linecap="round" opacity="0.7"/>`;
    case "notebook":
      return `<rect x="-84" y="-104" width="168" height="208" rx="30" fill="${color}" opacity="0.88"/><path d="M -50 -76 H 50" stroke="#FFFFFF" stroke-width="12" stroke-linecap="round" opacity="0.8"/><path d="M -50 -38 H 30" stroke="#FFFFFF" stroke-width="12" stroke-linecap="round" opacity="0.58"/><path d="M -50 2 H 54" stroke="#FFFFFF" stroke-width="12" stroke-linecap="round" opacity="0.58"/><path d="M -50 42 H 18" stroke="#FFFFFF" stroke-width="12" stroke-linecap="round" opacity="0.58"/>`;
    case "bulb":
      return `<path d="M 0 -124 C 60 -124 108 -78 108 -18 C 108 18 92 42 72 62 C 60 74 52 88 52 104 H -52 C -52 88 -60 74 -72 62 C -92 42 -108 18 -108 -18 C -108 -78 -60 -124 0 -124 Z" fill="${color}" opacity="0.88"/><rect x="-38" y="102" width="76" height="26" rx="13" fill="${color}" opacity="0.56"/>`;
    case "cards":
      return `<rect x="-104" y="-56" width="126" height="164" rx="28" fill="${color}" opacity="0.56" transform="rotate(-12)"/><rect x="-22" y="-78" width="126" height="164" rx="28" fill="${color}" opacity="0.88" transform="rotate(10)"/><rect x="60" y="-52" width="126" height="164" rx="28" fill="${color}" opacity="0.68" transform="rotate(28)"/>`;
    case "quiz":
      return `<circle cx="0" cy="0" r="112" fill="${color}" opacity="0.88"/><path d="M -36 -28 C -36 -58 -12 -80 18 -80 C 48 -80 72 -58 72 -28 C 72 -6 58 10 36 20 C 22 26 12 38 12 54" stroke="#FFFFFF" stroke-width="16" stroke-linecap="round" fill="none"/><circle cx="12" cy="82" r="12" fill="#FFFFFF"/>`;
    case "report":
      return `<rect x="-72" y="-108" width="144" height="216" rx="26" fill="${color}" opacity="0.88"/><path d="M -38 -34 H 36" stroke="#FFFFFF" stroke-width="12" stroke-linecap="round" opacity="0.8"/><path d="M -38 6 H 24" stroke="#FFFFFF" stroke-width="12" stroke-linecap="round" opacity="0.64"/><path d="M -38 46 H 40" stroke="#FFFFFF" stroke-width="12" stroke-linecap="round" opacity="0.64"/><circle cx="34" cy="82" r="18" fill="#FFFFFF" opacity="0.8"/>`;
    default:
      return `<circle cx="0" cy="0" r="90" fill="${color}" opacity="0.9"/>`;
  }
}

async function renderAsset(name, svg) {
  const svgPath = join(OUT_DIR, `${name}.svg`);
  const pngPath = join(OUT_DIR, `${name}.png`);
  await writeFile(svgPath, svg, "utf8");
  try {
    await sharp(Buffer.from(svg)).png().resize(PNG_SIZE, PNG_SIZE, { fit: "contain" }).toFile(pngPath);
  } catch (error) {
    console.warn(`PNG render skipped for ${name}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  for (const item of avatars) {
    await renderAsset(item.name, guideAvatar(item.variant));
  }

  for (const item of characters) {
    await renderAsset(item.name, characterPortrait(item.role));
  }

  for (const item of badges) {
    const svg = item.name === "icon-xp-star" ? starBadge() : badgeAsset(item.label, item.tier);
    await renderAsset(item.name, svg);
  }

  for (const item of scenes) {
    await renderAsset(item.name, sceneSvg(item.scene));
  }

  for (const item of demos) {
    await renderAsset(item.name, sceneSvg(item.scene));
  }

  for (const item of landing) {
    await renderAsset(item.name, sceneSvg(item.scene));
  }

  for (const item of empties) {
    await renderAsset(item.name, sceneSvg(item.scene));
  }

  const index = {
    generatedAt: new Date().toISOString(),
    assets: [
      ...avatars.map((item) => `${item.name}.png`),
      ...characters.map((item) => `${item.name}.png`),
      ...badges.map((item) => `${item.name}.png`),
      ...scenes.map((item) => `${item.name}.png`),
      ...demos.map((item) => `${item.name}.png`),
      ...landing.map((item) => `${item.name}.png`),
      ...empties.map((item) => `${item.name}.png`),
    ],
  };

  await writeFile(join(OUT_DIR, "index.json"), JSON.stringify(index, null, 2), "utf8");
  console.log(`Wrote ${index.assets.length} assets to ${OUT_DIR}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
