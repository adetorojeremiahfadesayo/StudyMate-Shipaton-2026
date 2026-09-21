import type { AnswerMode, SubjectType } from "@/types";

export type StoryContext = "past-question" | "aoc";

export type StoryGuide = {
  guideTitle: string;
  guideSubtitle: string;
  avatarLabel: string;
  intro: string;
  steps: string[];
  xpHint: string;
  modeLabel: string;
};

function subjectAvatar(subjectType: SubjectType) {
  switch (subjectType) {
    case "law":
      return "Counsel";
    case "engineering":
      return "Engineer";
    case "medicine":
      return "Clinician";
    case "economics":
      return "Analyst";
    default:
      return "Guide";
  }
}

export function getStoryGuide(subjectType: SubjectType, context: StoryContext, mode: AnswerMode = "story"): StoryGuide {
  const modeLabel = mode === "story" ? "Story Mode" : "Plain Mode";
  const avatarLabel = subjectAvatar(subjectType);

  if (subjectType === "law") {
    return context === "past-question"
      ? {
          guideTitle: "Client story",
          guideSubtitle: "A client walks in with facts, the issues get spotted, then the answer lands in court-ready form.",
          avatarLabel,
          intro:
            "A worried client narrates the dispute. Your job is to spot the issues, state the authorities, and give advice that wins the case.",
          steps: ["Client facts arrive", "Spot the legal issues", "Apply the authorities", "Give advice and win"],
          xpHint: "Earn Story XP for spotting the right issues and using the wiki cleanly.",
          modeLabel,
        }
      : {
          guideTitle: "Topic walkthrough",
          guideSubtitle: "Each topic becomes a mini courtroom or chambers scene, then we pull out the exam answer.",
          avatarLabel,
          intro: "A new law topic enters chambers. You turn it into a story, extract the rule, and explain how examiners test it.",
          steps: ["Topic enters chambers", "State the rule", "Link the cases", "Finish with exam tips"],
          xpHint: "Earn Story XP for clean legal reasoning and strong authority use.",
          modeLabel,
        };
  }

  if (subjectType === "engineering") {
    return context === "past-question"
      ? {
          guideTitle: "Problem scene",
          guideSubtitle: "A real-world system breaks down and you explain the concept, formula, and fix.",
          avatarLabel,
          intro:
            "A system fails, a signal looks wrong, or a circuit misbehaves. You identify the concept, formula, and application step by step.",
          steps: ["Problem setup", "Identify the concept", "Use the formula", "Explain the fix"],
          xpHint: "Earn Story XP for correct formula use and strong worked reasoning.",
          modeLabel,
        }
      : {
          guideTitle: "Topic walkthrough",
          guideSubtitle: "Each topic becomes a practical engineering scenario with the rule and application shown clearly.",
          avatarLabel,
          intro: "A topic comes in as a practical problem. You explain the concept, show the formula, and tell the student when to use it.",
          steps: ["Topic setup", "State the formula", "Define symbols", "Show where it applies"],
          xpHint: "Earn Story XP for concise derivations and correct application.",
          modeLabel,
        };
  }

  if (subjectType === "medicine") {
    return context === "past-question"
      ? {
          guideTitle: "Clinical scene",
          guideSubtitle: "A patient presents symptoms and you move through differential, management, and key warnings.",
          avatarLabel,
          intro:
            "A patient walks in with symptoms. You work through the likely condition, red flags, and the next step in care.",
          steps: ["Presenting complaint", "Likely condition", "Key facts and warnings", "Management and summary"],
          xpHint: "Earn Story XP for clear diagnosis logic and safe clinical reasoning.",
          modeLabel,
        }
      : {
          guideTitle: "Topic walkthrough",
          guideSubtitle: "Each topic becomes a clinic vignette that turns into fast revision.",
          avatarLabel,
          intro: "A drug or condition appears as a clinical case. You explain the facts, mechanism, and exam traps.",
          steps: ["Clinical setup", "State the key fact", "Connect the mechanism", "Finish with exam tips"],
          xpHint: "Earn Story XP for crisp clinical recall and safe reasoning.",
          modeLabel,
        };
  }

  if (subjectType === "economics") {
    return context === "past-question"
      ? {
          guideTitle: "Economic scene",
          guideSubtitle: "A person asks why prices, inflation, or demand are shifting and you explain the forces at play.",
          avatarLabel,
          intro:
            "A business owner or policymaker asks what is happening in the economy. You explain the concept, model, and policy response.",
          steps: ["Economic scene", "Identify the concept", "Apply the model", "Give policy advice"],
          xpHint: "Earn Story XP for strong model application and clean policy thinking.",
          modeLabel,
        }
      : {
          guideTitle: "Topic walkthrough",
          guideSubtitle: "Each topic becomes a market or policy story with a clean exam answer.",
          avatarLabel,
          intro: "A topic comes in as a market problem. You explain the theory, the implications, and the exam-ready conclusion.",
          steps: ["Topic setup", "State the theory", "Link the evidence", "Close with the implication"],
          xpHint: "Earn Story XP for clear model application and policy insight.",
          modeLabel,
        };
  }

  return context === "past-question"
    ? {
        guideTitle: "Study scene",
        guideSubtitle: "A grounded real-world scene helps you turn the wiki into a clean answer.",
        avatarLabel,
        intro: "StudyMate turns the question into a grounded scene, then walks you through the answer from the wiki pages.",
        steps: ["Story setup", "Find the key point", "Explain the evidence", "Give the answer"],
        xpHint: "Earn Story XP for using the wiki clearly and staying exam-focused.",
        modeLabel,
      }
    : {
        guideTitle: "Topic walkthrough",
        guideSubtitle: "Each topic becomes a guided revision moment anchored in the materials.",
        avatarLabel,
        intro: "StudyMate turns the topic into a guided study story so the answer stays clear and memorable.",
        steps: ["Topic setup", "State the idea", "Use the source pages", "Finish with the takeaway"],
        xpHint: "Earn Story XP for staying grounded in the source pages.",
        modeLabel,
      };
}
