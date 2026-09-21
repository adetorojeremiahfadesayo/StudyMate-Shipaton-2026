"use client";

import { ChangeEvent, FormEvent, useMemo, useState } from "react";
import {
  BookOpen,
  CheckCircle2,
  Download,
  FileText,
  Loader2,
  MessageSquareText,
  RotateCcw,
  Sparkles,
  Trophy,
  UploadCloud,
} from "lucide-react";

type DemoStage = "upload" | "process" | "topic" | "learn" | "exam" | "reward";
type LearnMode = "plain" | "story";
type MaterialStatus = "reading" | "ready" | "failed";
type StoryStep = "issue" | "rule" | "application";
type ExamStep = "issue" | "rule" | "advice";
type MateyPose = "welcome" | "reading" | "thinking" | "celebrate" | "badge";
type StoryAvatar = "lawyer" | "client" | "opposing" | "judge";

type UploadedMaterial = {
  name: string;
  text: string;
  status: MaterialStatus;
  error?: string;
};

const fallbackMaterial =
  "Specific performance is an equitable remedy. It is discretionary and may be granted where damages are inadequate, especially where the subject matter is unique. Equity also grants injunctions, rescission, rectification, delivery up, cancellation, and remedies against breach of trust.";

const defaultTopic = "specific performance";

const problemQuestion =
  "Amadi entered into a written contract to purchase a rare, historically significant 19th-century bronze artifact from Alao for N5,000,000 and paid a 20% deposit. Before delivery, Alao received a higher offer from a foreign collector and refused to deliver, offering to refund the deposit with interest. Amadi insists he wants the artifact itself, not money. Advise Amadi on his chances of securing specific performance.";

const demoMaterials: UploadedMaterial[] = [
  {
    name: "Equity seminar answer",
    status: "ready",
    text:
      "Specific performance is an equitable remedy rooted in the inadequacy of damages. It is discretionary and may be granted where the subject matter is unique, where the contract is certain, and where the claimant has acted fairly. It may be refused where the court would need constant supervision, where hardship would result, where the claimant delayed, or where an equitable bar is present.",
  },
  {
    name: "IRAC problem guide",
    status: "ready",
    text:
      "A problem question should be answered with Issue, Rule, Application, and Conclusion. The issue should be framed as a fact-specific legal question. The rule should cite cases, statutes, and principles. The application should be the longest part and should compare the facts with the legal authorities. The conclusion should give direct advice.",
  },
  {
    name: "Equity past question",
    status: "ready",
    text: problemQuestion,
  },
];

const suggestedQuestions = [
  {
    label: "Specific performance",
    value: "specific performance",
  },
  {
    label: "Breach of trust",
    value: "breach of trust",
  },
  {
    label: "Injunctions",
    value: "injunctions",
  },
];

const demoIssueAnswer =
  "Whether Amadi can obtain an order of specific performance compelling Alao to deliver the rare bronze artifact despite Alao's offer to refund the deposit with interest.";

const demoRuleAnswer =
  "Specific performance is an equitable and discretionary remedy granted where damages are inadequate. It is more likely where the contract is valid and certain and where the subject matter is unique, such as land or rare goods. It may be refused for hardship, uncertainty, delay, impossibility, unclean hands, lack of mutuality, or where the decree would require constant supervision.";

const demoAdviceAnswer =
  "Amadi should argue that damages are inadequate because the artifact is rare and historically significant. A refund with interest would return money, but it would not give him the unique object he contracted to buy. Alao's refusal is based on a higher offer, not impossibility, so the court may view him as trying to profit from breach. If the contract is valid, certain, and free from equitable bars, Amadi has a strong chance of securing specific performance.";

const demoStoryAnswers: Record<StoryStep, string> = {
  issue:
    "Whether Amadi can obtain specific performance compelling Alao to deliver the rare bronze artifact because damages may be inadequate.",
  rule:
    "Specific performance is discretionary and is usually granted where damages are inadequate, especially for unique property or rare goods. The court also considers certainty, hardship, delay, clean hands, impossibility, and supervision.",
  application:
    "Amadi should argue that the artifact is rare and historically significant, so a refund with interest is not an adequate substitute. Alao is refusing because of a better offer, not because performance is impossible, so Amadi has a strong argument if the contract is certain and no equitable bar applies.",
};

const mateyImages: Record<MateyPose, string> = {
  welcome: "/studymate-assets/matey/matey-welcome.png",
  reading: "/studymate-assets/matey/matey-reading.png",
  thinking: "/studymate-assets/matey/matey-thinking.png",
  celebrate: "/studymate-assets/matey/matey-celebrate.png",
  badge: "/studymate-assets/matey/matey-badge.png",
};

const storyAvatarImages: Record<StoryAvatar, string> = {
  lawyer: "/studymate-assets/matey/avatar-lawyer.png",
  client: "/studymate-assets/matey/avatar-client.png",
  opposing: "/studymate-assets/matey/avatar-opposing.png",
  judge: "/studymate-assets/matey/avatar-judge.png",
};

const xpAward = {
  uploadProcessed: 10,
  storyIssue: 15,
  storyRule: 20,
  storyAdvice: 25,
  examIssue: 20,
  examRule: 25,
  examAdvice: 35,
  pdfUnlock: 50,
};

const totalDemoXp = Object.values(xpAward).reduce((sum, points) => sum + points, 0);

function sourceExcerpt(material: string) {
  const source = material.trim() || fallbackMaterial;
  return `${source.slice(0, 520)}${source.length > 520 ? "..." : ""}`;
}

function normalizeTopic(topic: string) {
  return topic.trim() || defaultTopic;
}

function getExplanation(topicInput: string, material: string) {
  const topic = normalizeTopic(topicInput);
  const source = sourceExcerpt(material);
  const sections = [
    `Topic: ${topic}

Simple meaning
The answer is that specific performance is an equitable remedy. In simple terms, it is a court order compelling a contracting party to do the exact thing promised instead of merely paying damages for breach. It matters because some bargains cannot be fairly replaced by money. If the subject matter is unique, rare, historically important, or tied to land, damages may leave the claimant with cash but without the real benefit of the bargain. For ${topic}, the safest exam approach is to explain the equitable idea in plain language, connect it to authority, then apply it to the facts. If the topic is breach of trust, the simple meaning is that a trustee or fiduciary has failed to administer trust property according to the trust instrument, the law, and the duty of loyalty owed to beneficiaries.`,
    `Why Equity matters
Equity grew because the common law was often too formal. A claimant who could not fit into an existing writ, who needed more than money, or who faced unconscionable conduct might be left without a useful remedy. The handwritten notes you supplied explain this history through the movement from common law rigidity to the Court of Chancery, the Chancellor's conscience, the Earl of Oxford's Case, and the later fusion of administration under the Judicature Acts. A strong explanation treats Equity as principled justice, not random sympathy. It is a disciplined body of principles that tries to prevent injustice while still respecting legal rules. This is why maxims such as equity follows the law, delay defeats equity, he who seeks equity must do equity, and equity acts in personam are not decoration. They guide the court's discretion.`,
    `How to define the topic in an exam
Start with a usable definition. Do not write a definition that is so short that it cannot carry an answer. For ${topic}, define the doctrine or remedy in a way that already hints at the legal test. A good definition might say: "Specific performance is an equitable and discretionary remedy by which the court compels a contracting party to perform a contractual obligation where damages would not provide adequate justice, provided no equitable bar such as hardship, lack of clean hands, uncertainty, delay, or impossibility is present." That single definition gives the examiner the nature of the remedy, the reason it exists, and the factors that will structure the rest of the answer.`,
    `The IRAC lens
IRAC is important because it turns an ordinary explanation into a legal answer. Issue means the precise legal question arising from the facts. Rule means the legal principle, statute, case, or test that controls the issue. Application means the longest part of the answer: comparing the facts with the rule and authorities. Conclusion means advice. In a problem question, the issue should not be vague. "Whether Amadi can obtain specific performance of the contract for the rare bronze artifact because damages may be inadequate" is better than "whether Amadi will win." It combines facts and law and gives the examiner a clear route through the answer.`,
    `Issue spotting
For a problem question, look for the place where interests clash. In the past-consideration example you supplied, the conflict was that a promise to pay came after the performance. That revealed the issue of past consideration. In the artifact problem, the conflict is that Amadi wants the specific item, while Alao wants to escape by refunding money after receiving a better offer. That reveals the issue of adequacy of damages and the discretionary grant of specific performance. In a breach of trust problem, the conflict may be unauthorized investment, delegation by a trustee, conflict of interest, consent by beneficiaries, minors, profit from trust property, or loss to the trust fund.`,
    `Rule and authority
The rule section must contain law, not just opinion. This is where cases and statutes enter. Equity questions often ask students to answer "with decided cases and statutory provisions." That phrase means the examiner does not want general fairness talk. The examiner wants authority. For Equity generally, the Earl of Oxford's Case is useful for the historical priority of equity over common law in a conflict. Walsh v Lonsdale is useful for equitable treatment of certain agreements as done where conscience requires it. Errington v Errington is useful for equity protecting reliance in family/property arrangements. For specific performance, cases concerning inadequacy of damages, uniqueness of subject matter, certainty, supervision, mutuality, hardship, and conduct are the natural authorities to discuss. Where Nigerian materials are uploaded, Nigerian statutes and Supreme Court authorities must be preferred.`,
    `Cases and authorities to remember
A law answer should not dump cases without explaining why each case matters. Use cases as tools. The Earl of Oxford's Case shows the historical struggle and the idea that equity can restrain unconscionable reliance on common law rights. Walsh v Lonsdale shows how equity may treat as done that which ought to be done, especially where an agreement is specifically enforceable. Ryan v Mutual Tontine Westminster Chambers Association is often cited for the cautious and discretionary nature of specific performance. Falcke v Gray is commonly used for the idea that unique chattels may justify specific performance because damages may be inadequate. In trust questions, authorities on fiduciary duty, unauthorized investments, beneficiary consent, and trustee profit become central. In customary law questions, the repugnancy test and cases on inheritance and natural justice become central.`,
    `Statutory materials
Equity answers often need statutory provisions. The uploaded handwritten notes refer to reception statutes, ordinances, the Supreme Court Ordinance, the Interpretation Act, the Judicature Acts, the Married Women's Property Act, constitutional equality provisions, and customary-law validity tests. The exact statute depends on the topic. For specific performance, the statute may matter if the transaction concerns land, writing requirements, or property conveyancing. For trust administration, statutes on trustees, investments, public trustee functions, and capacity may matter. For customary law, the repugnancy clause and constitutional provisions on discrimination may matter. A student should always ask: what statute controls the form, capacity, validity, or remedy?`,
    `Elements of a strong explanation
A good explanation should move slowly. First, it gives background. Second, it defines the doctrine. Third, it explains the purpose of the doctrine. Fourth, it states the rule. Fifth, it gives authorities. Sixth, it explains the limits and exceptions. Seventh, it shows how examiners ask the topic. Eighth, it gives an exam paragraph. This is why a 200-word answer feels empty. Equity topics are layered. They involve history, conscience, maxims, discretion, remedies, facts, cases, statutes, and policy. A student needs the full map before attempting a problem question.`,
    `Applying ${topic} to facts
Application is the part that usually earns the most marks. Do not merely say "damages are inadequate" or "there was breach of trust." Explain why. In the artifact problem, the bronze is described as rare and historically significant. That fact supports uniqueness. Alao's higher offer shows opportunistic breach. Amadi's deposit supports seriousness and part performance of the bargain. The refund offer may reduce financial loss but does not solve the loss of the unique object. On the other side, the court will still ask whether the contract is certain, whether Amadi has acted fairly, whether supervision is possible, and whether any hardship or public policy reason exists for refusing relief.`,
    `How to write the issue
The issue should be framed as a question. The IRAC document says this clearly. It should be specific rather than general. For the artifact question, write: "Whether Amadi can obtain an order of specific performance compelling Alao to deliver the rare bronze artifact despite Alao's offer to refund the deposit with interest." That issue names the party, the remedy, the subject matter, and the legal conflict. For a breach of trust question, write: "Whether Inyang and Dennis are liable for breach of trust for making an unauthorized investment in CEL and whether the beneficiaries' alleged consent protects them." That issue immediately tells the examiner you saw the real problem.`,
    `How to write the rule
The rule should be general, then supported by authority. A useful rule paragraph for specific performance would say that specific performance is equitable, discretionary, and normally available where damages are inadequate. It is more likely for land or unique goods and less likely for personal service contracts, uncertain contracts, contracts requiring constant supervision, or cases where the claimant has delayed, acted unfairly, or caused hardship. A useful rule paragraph for breach of trust would say that trustees must obey the trust instrument, act prudently, avoid unauthorized investments, avoid conflicts, not profit secretly, act jointly where required, and protect beneficiaries. Beneficiary consent may matter, but minors or uninformed beneficiaries usually cannot give effective consent.`,
    `How to write the application
Application should be detailed and fact-sensitive. Use linking phrases: "In the present case," "This is similar to," "This differs from," "On the facts," "A court is likely to hold," and "However, the defendant may argue." If the rule has factors, apply each factor. For specific performance, discuss adequacy of damages, uniqueness, certainty, conduct, hardship, delay, supervision, and mutuality. For breach of trust, discuss the trustee's authority, the investment power, delegation, conflict, consent, loss, profit, and available remedies. The application should be longer than the rule because it is where you prove that you can reason with the law rather than merely recite it.`,
    `How to conclude
The conclusion is advice. It should be short but direct. Do not end with "it depends" unless you then say what it depends on and which side is stronger. A strong conclusion for the artifact problem might say: "Amadi has a credible claim for specific performance because the artifact is rare and damages may be inadequate. If the contract is certain and no equitable bar is proved, the court is likely to prefer delivery of the artifact over refund of the deposit." A strong conclusion for breach of trust might say: "The trustees are likely liable to restore the lost trust fund because the investment was unauthorized and the minors' consent cannot excuse the breach."`,
    `Common mistakes
The first mistake is writing a story without law. The second is listing cases without applying them. The third is stating the issue too generally. The fourth is treating Equity as pure morality. The fifth is forgetting that equitable remedies are discretionary. The sixth is ignoring bars such as laches, acquiescence, hardship, clean hands, impossibility, supervision, and inadequacy of consideration. The seventh is failing to separate multiple issues. If a question has specific performance and injunction, answer each with a separate IRAC structure. If a trust problem has delegation, unauthorized investment, beneficiary consent, minors, and trustee profit, separate those issues.`,
    `Essay questions
Essay questions in your Equity files use commands like critically analyse, discuss, examine, compare and contrast, and comment on the validity. For these, IRAC is less obvious but still useful. The issue becomes the debate raised by the question. The rule becomes the historical or doctrinal principles. The application becomes evaluation using cases, statutes, and examples. The conclusion becomes your reasoned position. For example, an essay on whether Equity has become rigid should discuss the history of Chancery, the maxims, the Judicature Acts, modern equitable remedies, and the tension between flexibility and certainty. It should not simply praise Equity.`,
    `Problem questions
Problem questions require advice. They usually hide legal issues inside facts. The trustee problem in the uploaded samples is a classic example: a will creates a trust, trustees run a business, one trustee delegates too much to another, one sets up a competing business, an unauthorized investment is made, minors purport to consent, money is lost, and a small dividend is paid to one beneficiary. That one question contains many issues: duty to act personally, duty to act jointly, unauthorized investment, duty of care, conflict of interest, beneficiary consent, capacity of minors, tracing or restoration, and remedies against trustees. A strong answer handles one issue at a time rather than trying to force every fact into one paragraph.`,
    `Story explanation mode
A story explanation can teach by dialogue. For ${topic}, imagine this tutorial: Amadi comes to a law clinic with proof that he paid for a rare artifact, but Alao now wants to sell to someone else for more money. The first question is not "who is morally right?" The first question is the legal issue: can Amadi obtain specific performance when damages may be inadequate? Once the issue is clear, the next step is the rule, then the cases, then the application to Amadi's facts. This mirrors an oral tutorial because the student retrieves the law step by step rather than passively reading a finished answer.`,
    `Internet and uploaded materials
Uploaded materials remain the foundation even when outside research is available. If the uploaded document contains local cases, lecturer notes, statutory provisions, or preferred wording, those should control the answer. Internet research is best used to fill gaps, clarify general doctrine, or update a principle; it should not overwrite the course material. A careful legal answer distinguishes between points grounded in the supplied material and points added as general support. If a Nigerian authority cannot be verified from the uploaded source or a reliable reference, the answer should say so rather than pretend certainty.`,
    `Sample exam paragraphs
Issue: Whether Amadi can obtain specific performance compelling Alao to deliver the rare bronze artifact despite Alao's offer to refund the deposit with interest.

Rule: Specific performance is an equitable remedy granted at the court's discretion where damages are inadequate. The remedy is more likely where the subject matter is unique, where the contract is certain, and where the claimant has acted fairly. It may be refused for hardship, uncertainty, delay, impossibility, lack of clean hands, or where the court would need constant supervision.

Application: In the present case, the artifact is described as rare and historically significant. This supports Amadi's argument that money cannot adequately replace the bargain. Alao's higher offer also suggests that he is attempting to profit from breach rather than facing a genuine impossibility. However, Amadi must still show that the contract is certain, enforceable, and free from equitable bars.

Conclusion: Amadi has a strong chance of obtaining specific performance if the contract is valid and certain, because refund of the deposit does not compensate for the loss of the unique artifact.`,
    `Revision checklist
Before writing, ask: What is the exact issue? What remedy or doctrine is involved? What are the elements? What cases prove the rule? Is there a statute? Which facts support the claimant? Which facts support the defendant? Are there equitable bars? What advice does the question ask for? After writing, check whether every paragraph performs a job. A paragraph should define, state authority, apply facts, compare cases, raise a counterargument, or conclude. If a paragraph does none of these, it is probably filler.`,
    `Short recap
For ${topic}, the student should remember five things. First, Equity is principled discretion, not loose sympathy. Second, legal authority matters: cases and statutes separate a law answer from ordinary opinion. Third, problem questions need fact-specific IRAC. Fourth, application is the longest and most important part. Fifth, the final advice must be direct. The explanation is deliberately detailed because a student needs enough law, structure, and examples to turn understanding into an exam-ready answer quickly.

Uploaded source signal: ${source}`,
  ];

  return sections.join("\n\n");
}

function getStoryPrompt(step: StoryStep, topicInput: string) {
  const topic = normalizeTopic(topicInput);

  if (step === "issue") {
    return {
      turn: "Tutor:",
      body: `Amadi walks into the law clinic with a receipt for a rare bronze artifact. Alao has refused to deliver because another buyer offered more money. We are studying ${topic}. Before we talk cases, what is the first legal issue you would frame for the examiner?`,
      task: "Your turn: spot the issue",
    };
  }

  if (step === "rule") {
    return {
      turn: "Tutor:",
      body: "Now move like a lawyer. State the rule. What must a claimant show before a court will grant specific performance, and what equitable bars might defeat the claim?",
      task: "Your turn: state the rule",
    };
  }

  return {
    turn: "Tutor:",
    body: "Now apply the law. Do not just say Amadi will win. Use the facts: rare artifact, deposit paid, higher third-party offer, refund offered, and the discretionary nature of Equity. What advice would you give Amadi?",
    task: "Your turn: apply and advise",
  };
}

function getStoryFeedback(step: StoryStep, response: string) {
  const hasCaseOrRule = /specific performance|damages|unique|discretion|equitable|artifact|rare/i.test(response);

  if (step === "issue") {
    return hasCaseOrRule
      ? "Good issue spotting: you connected the facts to the remedy and did not write a vague issue."
      : "Good start, but make the issue fact-specific. Mention Amadi, specific performance, and the rare artifact.";
  }

  if (step === "rule") {
    return hasCaseOrRule
      ? "Good rule work: you are moving from opinion into authority. Add cases or bars to make it exam-ready."
      : "The rule needs more law. Mention discretion, inadequacy of damages, uniqueness, certainty, and equitable bars.";
  }

  return hasCaseOrRule
    ? "Good application: you used the facts. In the final answer, add a short counterargument for Alao."
    : "Application needs facts. Compare the rarity of the artifact and the refund offer against adequacy of damages.";
}

function getIssueFeedback(issue: string) {
  return /whether|specific performance|amadi|artifact/i.test(issue)
    ? "Issue feedback: strong. Your issue is fact-specific and points to the remedy."
    : "Issue feedback: make it more precise. Use 'Whether Amadi can obtain specific performance of the rare artifact contract.'";
}

function getRuleFeedback(rule: string) {
  return /damages|discretion|unique|hardship|certainty|specific performance/i.test(rule)
    ? "Rule feedback: solid. You mentioned the discretionary nature of the remedy and the adequacy of damages."
    : "Rule feedback: add the controlling test. Mention discretion, inadequacy of damages, uniqueness, certainty, and equitable bars.";
}

function getFinalFeedback(issue: string, rule: string, advice: string) {
  const score =
    45 +
    (issue.length > 70 ? 15 : 6) +
    (/damages|unique|discretion|specific performance/i.test(rule) ? 20 : 8) +
    (/because|therefore|however|rare|refund|artifact|advise/i.test(advice) ? 20 : 8);

  return {
    score: Math.min(score, 95),
    issue: getIssueFeedback(issue),
    rule: getRuleFeedback(rule),
    missing:
      "Add at least one authority, explain why damages are inadequate, and mention possible equitable bars such as hardship, delay, uncertainty, or unclean hands.",
    improved:
      "The issue is whether Amadi can obtain specific performance compelling Alao to deliver the rare bronze artifact despite Alao's offer to refund the deposit with interest. Specific performance is an equitable and discretionary remedy, usually granted where damages are inadequate and the subject matter is unique, provided the contract is certain and no equitable bar applies. On the facts, the artifact is rare and historically significant, so a monetary refund may not place Amadi in the position he expected under the contract. Alao's refusal appears motivated by a higher offer rather than impossibility. Therefore, if the contract is valid and sufficiently certain, Amadi has a strong argument for specific performance, though Alao may resist by raising any relevant equitable bar.",
  };
}

function isTextLikeFile(fileName: string) {
  const nameLower = fileName.toLowerCase();
  return nameLower.endsWith(".txt") || nameLower.endsWith(".md") || nameLower.endsWith(".csv");
}

function MateySprite({ pose, className = "" }: { pose: MateyPose; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={mateyImages[pose]}
      alt={`Matey ${pose} pose`}
      className={`matey-float select-none object-contain drop-shadow-lg ${className}`}
    />
  );
}

function StorySprite({ avatar, className = "" }: { avatar: StoryAvatar; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={storyAvatarImages[avatar]}
      alt={`${avatar} story avatar`}
      className={`select-none object-contain drop-shadow-lg ${className}`}
    />
  );
}

function getStoryDialogue(step: StoryStep) {
  if (step === "issue") {
    return {
      speaker: "Amadi, the client",
      avatar: "client" as StoryAvatar,
      line: "I paid a deposit for a rare bronze artifact. Alao now wants to sell it to a foreign collector because they offered more money.",
      lawyerTask: "Type the legal issue as Amadi's lawyer.",
    };
  }

  if (step === "rule") {
    return {
      speaker: "Alao, the opposing party",
      avatar: "opposing" as StoryAvatar,
      line: "I can refund the deposit with interest. Surely money is enough, so why should a court force me to deliver the artifact?",
      lawyerTask: "Type the rule, key principles, and any cases or bars.",
    };
  }

  return {
    speaker: "Judge",
    avatar: "judge" as StoryAvatar,
    line: "Counsel, apply the law to the facts. Is refund enough, or is this a proper case for specific performance?",
    lawyerTask: "Type your advice and conclusion.",
  };
}

async function readDemoMaterial(file: File): Promise<UploadedMaterial> {
  if (isTextLikeFile(file.name)) {
    try {
      return {
        name: file.name,
        text: (await file.text()) || fallbackMaterial,
        status: "ready",
      };
    } catch {
      return {
        name: file.name,
        text: fallbackMaterial,
        status: "failed",
        error: "Could not read this text file. Using the demo sample instead.",
      };
    }
  }

  try {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/demo/extract", {
      method: "POST",
      body: formData,
    });

    const data = (await response.json()) as { text?: string; error?: string };
    if (!response.ok || !data.text) {
      throw new Error(data.error ?? "Failed to extract text from file.");
    }

    return {
      name: file.name,
      text: data.text,
      status: "ready",
    };
  } catch (err) {
    return {
      name: file.name,
      text: fallbackMaterial,
      status: "failed",
      error: err instanceof Error ? err.message : "Failed to extract text. Using the demo sample instead.",
    };
  }
}

export default function DemoPage() {
  const [stage, setStage] = useState<DemoStage>("upload");
  const [uploadedMaterials, setUploadedMaterials] = useState<UploadedMaterial[]>([]);
  const [materialText, setMaterialText] = useState("");
  const [topic, setTopic] = useState("");
  const [processing, setProcessing] = useState(false);
  const [mode, setMode] = useState<LearnMode>("plain");
  const [url, setUrl] = useState("");
  const [loadingFile, setLoadingFile] = useState(false);
  const [loadingUrl, setLoadingUrl] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [storyStep, setStoryStep] = useState<StoryStep>("issue");
  const [storyResponse, setStoryResponse] = useState("");
  const [storyFeedback, setStoryFeedback] = useState("");
  const [storyCompleted, setStoryCompleted] = useState(false);
  const [issueAnswer, setIssueAnswer] = useState("");
  const [ruleAnswer, setRuleAnswer] = useState("");
  const [adviceAnswer, setAdviceAnswer] = useState("");
  const [examStep, setExamStep] = useState<ExamStep>("issue");
  const [issueFeedback, setIssueFeedback] = useState("");
  const [ruleFeedback, setRuleFeedback] = useState("");
  const [xp, setXp] = useState(0);
  const [xpEvents, setXpEvents] = useState<string[]>([]);

  const readyMaterials = uploadedMaterials.filter((material) => material.status === "ready" || material.status === "failed");
  const combinedMaterial = [
    materialText.trim(),
    ...readyMaterials.map((material) => material.text.trim()).filter(Boolean),
  ]
    .filter(Boolean)
    .join("\n\n---\n\n");
  const hasMaterial = Boolean(combinedMaterial.trim());
  const materialLabel =
    uploadedMaterials.length > 0
      ? `${readyMaterials.length} materials: ${readyMaterials.map((material) => material.name).join(", ")}`
      : "Pasted course material";
  const activeTopic = normalizeTopic(topic);
  const explanation = useMemo(() => getExplanation(activeTopic, combinedMaterial), [activeTopic, combinedMaterial]);
  const storyPrompt = getStoryPrompt(storyStep, activeTopic);
  const storyDialogue = getStoryDialogue(storyStep);
  const finalFeedback = useMemo(
    () => getFinalFeedback(issueAnswer, ruleAnswer, adviceAnswer),
    [adviceAnswer, issueAnswer, ruleAnswer],
  );
  const mateyPose: MateyPose =
    stage === "upload"
      ? "welcome"
      : stage === "process"
        ? "reading"
        : stage === "topic"
          ? "badge"
          : stage === "learn"
            ? mode === "story" && storyCompleted
              ? "celebrate"
              : "thinking"
            : stage === "exam"
              ? "thinking"
              : "badge";
  const mateyMessage =
    stage === "upload"
      ? "Hi, I'm Matey. Load demo materials or upload your own notes, then I will coach you through the case."
      : stage === "topic"
        ? `Good job — process complete. You earned +${xpAward.uploadProcessed} XP. Pick a topic and I will turn it into practice.`
        : stage === "learn" && mode === "story" && storyCompleted
          ? `Story victory unlocked. You earned +${xpAward.storyAdvice} XP for the final advice. Continue to Exam Prep when you are ready.`
          : stage === "learn" && mode === "story"
          ? "Story Mode is a legal role-play. Read the character bubble, answer as the lawyer, and I will grade each step."
          : stage === "learn"
            ? "Plain Mode gives the serious exam-ready explanation. The full answer is also saved for your revision PDF."
            : stage === "exam"
              ? "Exam Prep time. Build the answer with issue, rule, then advice. Each successful step earns XP."
              : "Revision reward unlocked. Your XP, feedback, and exam-ready answer are ready for the PDF.";

  const awardXp = (label: string, points: number) => {
    setXp((current) => current + points);
    setXpEvents((current) => [`+${points} XP ${label}`, ...current].slice(0, 4));
  };

  const stageTitle = useMemo(() => {
    if (stage === "upload") return "Upload or paste material";
    if (stage === "process") return "Prepare your study path";
    if (stage === "topic") return "Choose a topic";
    if (stage === "learn") return mode === "story" ? "Learn in Story Mode" : "Learn in Plain Mode";
    if (stage === "exam") return "Exam Prep";
    return "Revision reward unlocked";
  }, [mode, stage]);

  const handleLoadDemoMaterials = () => {
    setUploadedMaterials(demoMaterials);
    setMaterialText("");
    setUrl("");
  };

  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const pickedFiles = Array.from(event.target.files ?? []).slice(0, 3);
    if (pickedFiles.length === 0) return;

    setUploadedMaterials(
      pickedFiles.map((file) => ({
        name: file.name,
        text: "",
        status: "reading",
      })),
    );
    setLoadingFile(true);
    try {
      setUploadedMaterials(await Promise.all(pickedFiles.map(readDemoMaterial)));
    } finally {
      setLoadingFile(false);
    }
  };

  const handleUrlImport = async (event: FormEvent) => {
    event.preventDefault();
    if (!url.trim()) return;

    setLoadingUrl(true);
    try {
      const response = await fetch("/api/demo/extract-url", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: url.trim() }),
      });

      const data = (await response.json()) as { text?: string; title?: string; error?: string };
      if (!response.ok || !data.text) {
        throw new Error(data.error ?? "Failed to extract article content.");
      }

      setUploadedMaterials([
        {
          name: `[Article] ${data.title ?? "Imported"}`,
          text: data.text,
          status: "ready",
        },
      ]);
      setUrl("");
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Failed to import web article. Please try pasting the text instead.");
    } finally {
      setLoadingUrl(false);
    }
  };

  const handleProcess = () => {
    if (!hasMaterial || processing || loadingFile || loadingUrl) return;

    setProcessing(false);
    awardXp("Material processed", xpAward.uploadProcessed);
    setStage("topic");
  };

  const handleExplainTopic = () => {
    setTopic(activeTopic);
    setMode("plain");
    setStoryStep("issue");
    setStoryResponse("");
    setStoryFeedback("");
    setStoryCompleted(false);
    setExamStep("issue");
    setIssueAnswer("");
    setRuleAnswer("");
    setAdviceAnswer("");
    setIssueFeedback("");
    setRuleFeedback("");
    setStage("learn");
  };

  const handleStoryResponse = () => {
    if (storyCompleted) return;

    const feedback = getStoryFeedback(storyStep, storyResponse);
    setStoryFeedback(feedback);
    setStoryResponse("");

    if (storyStep === "issue") {
      awardXp("Story issue", xpAward.storyIssue);
      setStoryStep("rule");
      return;
    }

    if (storyStep === "rule") {
      awardXp("Story rule", xpAward.storyRule);
      setStoryStep("application");
      return;
    }

    awardXp("Story advice complete", xpAward.storyAdvice);
    setStoryCompleted(true);
  };

  const handleSubmitIssue = () => {
    setIssueFeedback(getIssueFeedback(issueAnswer));
    awardXp("Exam issue", xpAward.examIssue);
    setExamStep("rule");
  };

  const handleSubmitRule = () => {
    setRuleFeedback(getRuleFeedback(ruleAnswer));
    awardXp("Exam rule", xpAward.examRule);
    setExamStep("advice");
  };

  const handleSubmitAdvice = () => {
    awardXp("Exam advice", xpAward.examAdvice);
    awardXp("Revision PDF unlocked", xpAward.pdfUnlock);
    setStage("reward");
  };

  const handleDownloadPdf = async () => {
    setDownloadingPdf(true);
    try {
      const { jsPDF } = await import("jspdf");
      const pdf = new jsPDF();
      const lines = [
        "StudyMate Revision PDF",
        "",
        `Topic: ${activeTopic}`,
        `Material: ${materialLabel}`,
        "",
        "Topic explanation",
        explanation,
        "",
        "Problem question",
        problemQuestion,
        "",
        "Student issue",
        issueAnswer,
        "",
        "Student rule",
        ruleAnswer,
        "",
        "Student advice",
        adviceAnswer,
        "",
        "Better exam-ready version",
        finalFeedback.improved,
        "",
        "Weak area to revise",
        finalFeedback.missing,
      ];

      let y = 18;
      for (const line of lines) {
        const wrapped = pdf.splitTextToSize(line, 178) as string[];
        for (const textLine of wrapped) {
          if (y > 280) {
            pdf.addPage();
            y = 18;
          }
          pdf.text(textLine, 16, y);
          y += 7;
        }
      }

      pdf.save("studymate-irac-revision.pdf");
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleReset = () => {
    setStage("upload");
    setUploadedMaterials([]);
    setMaterialText("");
    setTopic("");
    setProcessing(false);
    setMode("plain");
    setUrl("");
    setStoryStep("issue");
    setStoryResponse("");
    setStoryFeedback("");
    setStoryCompleted(false);
    setIssueAnswer("");
    setRuleAnswer("");
    setAdviceAnswer("");
    setExamStep("issue");
    setIssueFeedback("");
    setRuleFeedback("");
    setXp(0);
    setXpEvents([]);
  };

  return (
    <main className="min-h-screen bg-[#070914] px-4 py-8 text-white">
      <section className="mx-auto w-full max-w-6xl">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-violet-200">StudyMate demo</p>
            <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">{stageTitle}</h1>
          </div>

          <div className="rounded-lg bg-white/10 px-4 py-3 text-right">
            <p className="text-xs text-slate-300">Law tutor mode</p>
            <p className="text-2xl font-black">IRAC</p>
          </div>
        </div>

        <section className="mt-6 grid gap-4 rounded-lg border border-white/10 bg-white/10 p-4 shadow-xl shadow-black/20 lg:grid-cols-[160px_1fr_220px]">
          <div className="mx-auto w-32 sm:w-36">
            <MateySprite pose={mateyPose} />
          </div>
          <div className="self-center">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-amber-200">Matey coach</p>
            <p className="mt-2 text-base font-bold leading-7 text-white">{mateyMessage}</p>
            {stage === "topic" ? (
              <p className="mt-2 inline-flex rounded-full bg-emerald-300 px-3 py-1 text-xs font-black text-slate-950">
                Good job — process complete
              </p>
            ) : null}
          </div>
          <div className="rounded-lg bg-slate-950/70 p-4">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Demo XP</p>
                <p className="text-3xl font-black text-emerald-300">{xp}</p>
              </div>
              <p className="text-sm font-bold text-slate-300">/{totalDemoXp}</p>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-emerald-300 transition-all duration-500"
                style={{ width: `${Math.min(100, (xp / totalDemoXp) * 100)}%` }}
              />
            </div>
            {xpEvents.length > 0 ? (
              <div className="mt-3 space-y-1" aria-label="XP events">
                {xpEvents.map((event) => (
                  <p key={event} className="xp-pop rounded-md bg-emerald-300/10 px-2 py-1 text-xs font-bold text-emerald-100">
                    {event}
                  </p>
                ))}
              </div>
            ) : null}
          </div>
        </section>

        <div className="mt-6 grid gap-2 sm:grid-cols-5">
          {["Upload", "Topic", "Learn", "Exam Prep", "Revision PDF"].map((label, index) => {
            const currentIndex =
              stage === "upload" || stage === "process" ? 0 : stage === "topic" ? 1 : stage === "learn" ? 2 : stage === "exam" ? 3 : 4;
            const isActive = index === currentIndex;
            const isDone = index < currentIndex;

            return (
              <div
                key={label}
                className={`rounded-lg border px-4 py-3 text-sm font-bold ${
                  isActive
                    ? "border-emerald-300 bg-emerald-300 text-slate-950"
                    : isDone
                      ? "border-emerald-300/40 bg-emerald-300/10 text-emerald-100"
                      : "border-white/10 bg-white/5 text-slate-300"
                }`}
              >
                {label}
              </div>
            );
          })}
        </div>

        <article className="mt-6 rounded-lg border border-white/10 bg-white p-5 text-slate-950 shadow-2xl shadow-black/30 sm:p-8">
          {stage === "upload" ? (
            <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
              <div>
                <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-violet-100 text-violet-700">
                  <UploadCloud className="h-7 w-7" />
                </div>
                <h2 className="mt-5 text-3xl font-black tracking-tight">Start with up to three materials</h2>
                <p className="mt-3 text-base leading-7 text-slate-600">
                  Drop course materials, past questions, seminar answers, or IRAC notes. The demo combines them into one
                  study source before asking what topic you want explained.
                </p>
              </div>

              <div>
                <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                  <p className="text-sm font-black text-emerald-900">Judge shortcut</p>
                  <p className="mt-1 text-sm leading-6 text-emerald-800">
                    For judges: click this to load sample Equity notes and questions instantly.
                  </p>
                  <button
                    type="button"
                    onClick={handleLoadDemoMaterials}
                    disabled={loadingFile || loadingUrl}
                    className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Sparkles className="h-4 w-4" />
                    Load demo materials
                  </button>
                </div>

                <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-violet-200 bg-violet-50 px-5 py-7 text-center transition hover:border-violet-400">
                  {loadingFile ? (
                    <Loader2 className="h-8 w-8 animate-spin text-violet-700" />
                  ) : (
                    <UploadCloud className="h-8 w-8 text-violet-700" />
                  )}
                  <span className="mt-3 text-sm font-bold text-violet-700">
                    {loadingFile
                      ? "Reading materials..."
                      : uploadedMaterials.length > 0
                        ? `${readyMaterials.length} materials ready`
                        : "Choose up to 3 materials (PDF, TXT, MD, DOCX, PNG, JPG)"}
                  </span>
                  <input
                    type="file"
                    accept=".txt,.md,.csv,.pdf,.png,.jpg,.jpeg,.docx"
                    multiple
                    onChange={handleFile}
                    disabled={loadingFile || loadingUrl}
                    className="hidden"
                  />
                </label>

                {uploadedMaterials.length > 0 ? (
                  <div className="mt-3 space-y-2">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      {readyMaterials.length} of 3 materials ready
                    </p>
                    {uploadedMaterials.map((material) => (
                      <div
                        key={material.name}
                        className="flex items-start justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
                      >
                        <span className="min-w-0 truncate font-semibold text-slate-800">{material.name}</span>
                        <span
                          className={`shrink-0 rounded-md px-2 py-1 text-xs font-bold ${
                            material.status === "ready"
                              ? "bg-emerald-100 text-emerald-700"
                              : material.status === "failed"
                                ? "bg-amber-100 text-amber-700"
                                : "bg-violet-100 text-violet-700"
                          }`}
                        >
                          {material.status === "ready" ? "Ready" : material.status === "failed" ? "Fallback" : "Reading"}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : null}

                <form onSubmit={handleUrlImport} className="mt-4 flex gap-2">
                  <input
                    type="url"
                    value={url}
                    onChange={(event) => setUrl(event.target.value)}
                    disabled={loadingFile || loadingUrl}
                    placeholder="Paste article URL"
                    className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-violet-300 focus:bg-white"
                  />
                  <button
                    type="submit"
                    disabled={!url.trim() || loadingFile || loadingUrl}
                    className="inline-flex min-w-24 items-center justify-center rounded-lg bg-violet-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {loadingUrl ? <Loader2 className="h-4 w-4 animate-spin" /> : "Import"}
                  </button>
                </form>

                <textarea
                  value={materialText}
                  onChange={(event) => setMaterialText(event.target.value)}
                  placeholder="Or paste material here: Negligence is a tort..."
                  className="mt-4 min-h-36 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-7 text-slate-900 outline-none transition focus:border-violet-300 focus:bg-white"
                />

                <button
                  type="button"
                  onClick={handleProcess}
                  disabled={!hasMaterial || loadingFile || loadingUrl}
                  className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-violet-600 px-5 py-4 text-base font-bold text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Process Material
                </button>
              </div>
            </div>
          ) : null}

          {stage === "process" ? (
            <div>
              <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-violet-100 text-violet-700">
                {processing ? <Loader2 className="h-7 w-7 animate-spin" /> : <CheckCircle2 className="h-7 w-7" />}
              </div>
              <h2 className="mt-5 text-3xl font-black tracking-tight">Finding the important ideas</h2>
              <p className="mt-3 text-base leading-7 text-slate-600">
                StudyMate is reading {materialLabel} and preparing a topic-first law tutor flow.
              </p>
              <div className="mt-6 h-3 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full w-3/4 animate-pulse rounded-full bg-emerald-500" />
              </div>
            </div>
          ) : null}

          {stage === "topic" ? (
            <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
              <div>
                <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                  <MessageSquareText className="h-7 w-7" />
                </div>
                <h2 className="mt-5 text-3xl font-black tracking-tight">What topic should we study?</h2>
                <p className="mt-3 text-base leading-7 text-slate-600">
                  I have read your materials. What topic do you want me to explain?
                </p>
                <p className="mt-4 rounded-lg bg-slate-50 p-4 text-sm leading-7 text-slate-700">
                  The demo is tuned for Equity and IRAC: specific performance, injunction, breach of trust,
                  equitable assignment, maxims, customary law, and similar law topics.
                </p>
              </div>

              <div>
                <label className="text-sm font-bold text-slate-800" htmlFor="topic-input">
                  Topic
                </label>
                <input
                  id="topic-input"
                  value={topic}
                  onChange={(event) => setTopic(event.target.value)}
                  placeholder="e.g. specific performance, breach of trust, injunction"
                  className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-900 outline-none transition focus:border-emerald-300 focus:bg-white"
                />
                <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-black uppercase tracking-wider text-slate-500">
                    Ask this question or custom question
                  </p>
                  <div className="mt-3 grid gap-2 sm:grid-cols-3">
                    {suggestedQuestions.map((question) => (
                      <button
                        key={question.value}
                        type="button"
                        onClick={() => setTopic(question.value)}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm font-bold text-slate-800 transition hover:border-emerald-300 hover:text-emerald-700"
                      >
                        Ask this question: {question.label}
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleExplainTopic}
                  className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-5 py-4 text-base font-bold text-white transition hover:bg-emerald-500"
                >
                  Explain topic
                  <BookOpen className="h-5 w-5" />
                </button>
              </div>
            </div>
          ) : null}

          {stage === "learn" ? (
            <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
              <div>
                <div className="inline-flex rounded-lg bg-slate-100 p-1">
                  {(["plain", "story"] as const).map((nextMode) => (
                    <button
                      key={nextMode}
                      type="button"
                      onClick={() => setMode(nextMode)}
                      className={`rounded-md px-4 py-2 text-sm font-bold transition ${
                        mode === nextMode ? "bg-slate-950 text-white" : "text-slate-600 hover:text-slate-950"
                      }`}
                    >
                      {nextMode === "plain" ? "Plain Mode" : "Story Mode"}
                    </button>
                  ))}
                </div>

                <h2 className="mt-6 flex items-center gap-2 text-3xl font-black tracking-tight">
                  {mode === "story" ? <Sparkles className="h-7 w-7 text-violet-600" /> : <BookOpen className="h-7 w-7 text-emerald-600" />}
                  {mode === "story" ? "Conversation tutor" : `Explain ${activeTopic} plainly`}
                </h2>

                {mode === "plain" ? (
                  <div
                    data-testid="plain-explanation"
                    className="mt-5 max-h-[720px] overflow-y-auto whitespace-pre-line rounded-lg bg-slate-50 p-5 text-sm leading-7 text-slate-700"
                  >
                    {explanation}
                  </div>
                ) : (
                  <div className="mt-5 rounded-lg border border-violet-100 bg-violet-50 p-4 sm:p-5">
                    <div className="grid gap-4 md:grid-cols-[112px_1fr]">
                      <MateySprite pose={storyCompleted ? "celebrate" : "thinking"} className="mx-auto w-24" />
                      <div className="rounded-2xl rounded-tl-sm bg-white p-4 shadow-sm">
                        <p className="text-sm font-black text-violet-800">{storyPrompt.turn}</p>
                        <p className="mt-2 text-sm leading-7 text-slate-800">{storyPrompt.body}</p>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-4 md:grid-cols-[112px_1fr]">
                      <StorySprite avatar={storyDialogue.avatar} className="mx-auto w-24" />
                      <div className="rounded-2xl rounded-tl-sm bg-white p-4 shadow-sm">
                        <p className="text-xs font-black uppercase tracking-wider text-slate-500">{storyDialogue.speaker}</p>
                        <p className="mt-2 text-sm font-semibold leading-7 text-slate-800">{storyDialogue.line}</p>
                      </div>
                    </div>

                    {storyFeedback ? (
                      <p className="mt-4 rounded-lg bg-emerald-50 p-4 text-sm font-semibold leading-6 text-emerald-800">
                        {storyFeedback}
                      </p>
                    ) : null}

                    {storyCompleted ? (
                      <div className="mt-5 rounded-2xl border border-emerald-200 bg-white p-5 shadow-sm">
                        <div className="grid gap-4 md:grid-cols-[112px_1fr]">
                          <MateySprite pose="celebrate" className="mx-auto w-24" />
                          <div>
                            <p className="text-xs font-black uppercase tracking-wider text-emerald-600">Story victory</p>
                            <h3 className="mt-2 text-2xl font-black text-slate-950">Story Mode complete</h3>
                            <p className="mt-2 text-sm font-semibold leading-7 text-slate-700">
                              You finished the client story, gave legal advice, and earned +{xpAward.storyAdvice} XP.
                              Move into Exam Prep to turn the story into a full IRAC answer.
                            </p>
                            <button
                              type="button"
                              onClick={() => setStage("exam")}
                              className="mt-4 inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-500"
                            >
                              Continue to Exam Prep
                              <FileText className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-5 grid gap-4 md:grid-cols-[112px_1fr]">
                        <StorySprite avatar="lawyer" className="mx-auto w-24" />
                        <div className="rounded-2xl rounded-tl-sm border border-violet-200 bg-white p-4 shadow-sm">
                          <label className="block text-sm font-black text-slate-900" htmlFor="story-response">
                            {storyPrompt.task}
                          </label>
                          <p className="mt-1 text-xs font-bold text-violet-700">{storyDialogue.lawyerTask}</p>
                          <p className="mt-3 rounded-lg bg-amber-50 p-3 text-xs font-bold leading-5 text-amber-900">
                            For demo: use Demo pass to auto-fill the lawyer&apos;s answer and test Story Mode progression.
                          </p>
                          <textarea
                            id="story-response"
                            value={storyResponse}
                            onChange={(event) => setStoryResponse(event.target.value)}
                            placeholder="Type your response to the tutor..."
                            className="mt-3 min-h-32 w-full rounded-lg border border-violet-200 bg-violet-50 px-4 py-3 text-sm leading-7 text-slate-900 outline-none transition focus:border-violet-400 focus:bg-white"
                          />
                          <button
                            type="button"
                            onClick={() => setStoryResponse(demoStoryAnswers[storyStep])}
                            className="mt-3 mr-3 inline-flex items-center justify-center rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-900 transition hover:bg-amber-100"
                          >
                            Demo pass: fill story answer
                          </button>
                          <button
                            type="button"
                            onClick={handleStoryResponse}
                            disabled={!storyResponse.trim()}
                            className="mt-3 inline-flex items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Submit response
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <aside className={`rounded-lg border p-5 ${mode === "story" && storyCompleted ? "border-emerald-300 bg-emerald-100" : "border-emerald-200 bg-emerald-50"}`}>
                <p className="text-sm font-bold text-emerald-800">
                  {mode === "story" && storyCompleted ? "Victory unlocked" : "Ready to practice"}
                </p>
                <p className="mt-2 text-sm leading-6 text-emerald-900">
                  {mode === "story" && storyCompleted
                    ? "Story Mode is complete. Continue to Exam Prep to earn the next XP rewards."
                    : "Move into a progressive IRAC problem question based on the topic."}
                </p>
                <button
                  type="button"
                  onClick={() => setStage("exam")}
                  className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-500"
                >
                  Jump to Exam Prep
                  <FileText className="h-4 w-4" />
                </button>
              </aside>
            </div>
          ) : null}

          {stage === "exam" ? (
            <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
              <div>
                <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                  <FileText className="h-7 w-7" />
                </div>
                <h2 className="mt-5 text-3xl font-black tracking-tight">Practice with IRAC</h2>
                <p className="mt-3 rounded-lg bg-slate-50 p-4 text-base font-semibold leading-7 text-slate-800">
                  {problemQuestion}
                </p>
                <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-bold leading-6 text-amber-900">
                  For demo: use Demo pass to auto-fill a good answer so judges can see the grading flow.
                </p>

                {issueFeedback ? <p className="mt-4 rounded-lg bg-emerald-50 p-4 text-sm font-bold text-emerald-800">{issueFeedback}</p> : null}
                {ruleFeedback ? <p className="mt-4 rounded-lg bg-emerald-50 p-4 text-sm font-bold text-emerald-800">{ruleFeedback}</p> : null}

                {examStep === "issue" ? (
                  <div className="mt-5">
                    <label className="text-sm font-black text-slate-900" htmlFor="issue-answer">
                      Step 1: frame the issue
                    </label>
                    <textarea
                      id="issue-answer"
                      value={issueAnswer}
                      onChange={(event) => setIssueAnswer(event.target.value)}
                      placeholder="Write the legal issue here..."
                      className="mt-2 min-h-32 w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm leading-7 text-slate-900 outline-none transition focus:border-emerald-300"
                    />
                    <button
                      type="button"
                      onClick={() => setIssueAnswer(demoIssueAnswer)}
                      className="mt-3 mr-3 rounded-lg border border-amber-300 bg-amber-50 px-5 py-3 text-sm font-bold text-amber-900 transition hover:bg-amber-100"
                    >
                      Demo pass: fill issue
                    </button>
                    <button
                      type="button"
                      onClick={handleSubmitIssue}
                      disabled={!issueAnswer.trim()}
                      className="mt-3 rounded-lg bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Submit issue
                    </button>
                  </div>
                ) : null}

                {examStep === "rule" ? (
                  <div className="mt-5">
                    <label className="text-sm font-black text-slate-900" htmlFor="rule-answer">
                      Step 2: state the rule
                    </label>
                    <textarea
                      id="rule-answer"
                      value={ruleAnswer}
                      onChange={(event) => setRuleAnswer(event.target.value)}
                      placeholder="State the rule, cases, and statutes..."
                      className="mt-2 min-h-36 w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm leading-7 text-slate-900 outline-none transition focus:border-emerald-300"
                    />
                    <button
                      type="button"
                      onClick={() => setRuleAnswer(demoRuleAnswer)}
                      className="mt-3 mr-3 rounded-lg border border-amber-300 bg-amber-50 px-5 py-3 text-sm font-bold text-amber-900 transition hover:bg-amber-100"
                    >
                      Demo pass: fill rule
                    </button>
                    <button
                      type="button"
                      onClick={handleSubmitRule}
                      disabled={!ruleAnswer.trim()}
                      className="mt-3 rounded-lg bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Submit rule
                    </button>
                  </div>
                ) : null}

                {examStep === "advice" ? (
                  <div className="mt-5">
                    <label className="text-sm font-black text-slate-900" htmlFor="advice-answer">
                      Step 3: apply and advise
                    </label>
                    <textarea
                      id="advice-answer"
                      value={adviceAnswer}
                      onChange={(event) => setAdviceAnswer(event.target.value)}
                      placeholder="Apply the law and advise the party..."
                      className="mt-2 min-h-44 w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm leading-7 text-slate-900 outline-none transition focus:border-emerald-300"
                    />
                    <button
                      type="button"
                      onClick={() => setAdviceAnswer(demoAdviceAnswer)}
                      className="mt-3 mr-3 rounded-lg border border-amber-300 bg-amber-50 px-5 py-3 text-sm font-bold text-amber-900 transition hover:bg-amber-100"
                    >
                      Demo pass: fill advice
                    </button>
                    <button
                      type="button"
                      onClick={handleSubmitAdvice}
                      disabled={!adviceAnswer.trim()}
                      className="mt-3 rounded-lg bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Submit advice
                    </button>
                  </div>
                ) : null}
              </div>

              <aside className="rounded-lg border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm font-bold text-slate-950">IRAC checklist</p>
                <ul className="mt-3 space-y-3 text-sm leading-6 text-slate-700">
                  <li>Issue: fact-specific whether question</li>
                  <li>Rule: definition, cases, statutes, bars</li>
                  <li>Application: compare facts to law</li>
                  <li>Conclusion: direct advice</li>
                </ul>
              </aside>
            </div>
          ) : null}

          {stage === "reward" ? (
            <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
              <div>
                <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                  <Trophy className="h-7 w-7" />
                </div>
                <h2 className="mt-5 text-3xl font-black tracking-tight">Your IRAC feedback</h2>
                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-lg bg-violet-50 px-4 py-3">
                    <p className="text-xs font-bold text-violet-700">XP</p>
                    <p className="text-xl font-black">{xp}/{totalDemoXp}</p>
                  </div>
                  <div className="rounded-lg bg-emerald-50 px-4 py-3">
                    <p className="text-xs font-bold text-emerald-700">Overall IRAC score</p>
                    <p className="text-xl font-black">{finalFeedback.score}%</p>
                  </div>
                  <div className="rounded-lg bg-amber-50 px-4 py-3">
                    <p className="text-xs font-bold text-amber-700">PDF</p>
                    <p className="text-xl font-black">Ready</p>
                  </div>
                </div>

                <div className="mt-5 space-y-4 rounded-lg bg-slate-50 p-5 text-sm leading-7 text-slate-700">
                  <p>
                    <strong>Issue feedback:</strong> {finalFeedback.issue}
                  </p>
                  <p>
                    <strong>Rule feedback:</strong> {finalFeedback.rule}
                  </p>
                  <p>
                    <strong>What is missing:</strong> {finalFeedback.missing}
                  </p>
                  <p>
                    <strong>Better exam-ready version:</strong> {finalFeedback.improved}
                  </p>
                </div>
              </div>

              <aside className="rounded-lg border border-emerald-200 bg-emerald-50 p-5">
                <p className="text-sm font-bold text-emerald-800">Unlock revision PDF</p>
                <p className="mt-2 text-sm leading-6 text-emerald-900">
                  Includes the topic explanation, problem question, your IRAC answers, improved answer, and weak areas.
                </p>
                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  disabled={downloadingPdf}
                  className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-500 disabled:cursor-wait disabled:opacity-70"
                >
                  {downloadingPdf ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                  Download Revision PDF
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-emerald-300 px-4 py-3 text-sm font-bold text-emerald-900 transition hover:bg-emerald-100"
                >
                  <RotateCcw className="h-4 w-4" />
                  Try another material
                </button>
              </aside>
            </div>
          ) : null}
        </article>
      </section>
    </main>
  );
}
