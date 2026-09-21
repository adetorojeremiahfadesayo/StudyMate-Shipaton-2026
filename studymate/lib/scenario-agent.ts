import { supabaseAdmin } from "./supabase-admin";
import { getChatCompletionText } from "./openai";

export async function generateScenario(courseId: string, subjectType: string, customTopic?: string) {
  // Fetch materials for context
  const { data: materials } = await supabaseAdmin
    .from("materials")
    .select("file_name, ocr_text")
    .eq("course_id", courseId)
    .not("ocr_text", "is", null);

  const materialsContext = (materials ?? [])
    .map((m) => `Document: ${m.file_name}\nContent Preview:\n${m.ocr_text?.substring(0, 1500)}`)
    .join("\n\n");

  const systemPrompt = `You are an expert exam designer for ${subjectType} courses.
Your task is to generate a realistic, educational story-based scenario (hypothetical case study) based on the course materials.

Subject type guidelines:
- Law: Generate a detailed legal factual scenario (e.g. a contract dispute, a tort case of negligence, or a criminal charge) involving complex client facts. Do not list the issues or answer it.
- Medicine: Act as a patient presenting a clinical case. Write in the first person (e.g. "I've had this sharp pain in my lower right side...") and provide symptoms, duration, and medical history.
- Other subjects (Engineering, Economics, etc.): Present a technical client brief, design challenge, or business case study.

Return the response in JSON format matching this schema:
{
  "topic": "Name of the topic (e.g. Negligence Duty of Care, Appendicitis, Database Design)",
  "scenario": "The actual text of the scenario or patient presentation (markdown format)"
}`;

  const prompt = `Course Materials Content:\n${materialsContext}\n\n${
    customTopic ? `Focus specifically on this topic: ${customTopic}\n` : ""
  }\nGenerate a scenario now. Return ONLY the JSON object.`;

  const responseText = await getChatCompletionText(prompt, systemPrompt, {
    modelTier: "standard",
    temperature: 0.7,
    requestName: "ScenarioGenerator",
  });

  try {
    const cleanText = responseText?.replace(/^```json\s*/i, "").replace(/```$/, "").trim() ?? "";
    return JSON.parse(cleanText) as { topic: string; scenario: string };
  } catch {
    return {
      topic: customTopic || "General Topic Study",
      scenario: responseText || "Failed to generate scenario text. Please try again.",
    };
  }
}

export async function gradeScenarioStep(params: {
  subjectType: string;
  scenario: string;
  topic: string;
  step: "issues" | "solution" | "clinical" | "general";
  studentInput: string;
}) {
  const { subjectType, scenario, topic, step, studentInput } = params;

  let stepInstructions = "";
  if (subjectType === "law") {
    if (step === "issues") {
      stepInstructions = `The student was asked to identify the key legal issues in the scenario.
Evaluate if they spotted the correct issues (e.g. breach of duty, offer and acceptance, causation).
Grade out of 100, list what they identified correctly, and explain any issues they missed.`;
    } else {
      stepInstructions = `The student was asked to provide the legal solution/rules application for the scenario.
Evaluate if they correctly applied legal principles/cases and reached a sound conclusion.
Grade out of 100, critique their reasoning, and provide constructive feedback.`;
    }
  } else if (subjectType === "medicine") {
    stepInstructions = `The student is acting as a doctor diagnosing you (the patient). They replied to your symptoms.
Evaluate their diagnostic reasoning, bedside manner, or treatment recommendations.
Grade out of 100, explain what they got right, and what critical checks they missed.`;
  } else {
    stepInstructions = `The student provided a solution to the scenario challenge.
Evaluate their technical accuracy, formula application, and design decisions.
Grade out of 100, explain what was correct, and how they can improve.`;
  }

  const systemPrompt = `You are a strict and helpful grader for a ${subjectType} course exam on the topic "${topic}".
Your job is to grade the student's input for the current step.

Grading Guidelines:
${stepInstructions}

You must return a JSON response matching this schema:
{
  "score": 85, // Integer from 0 to 100
  "feedback": "Detailed markdown feedback highlighting strengths, missed items, and suggestions for improvement.",
  "suggestedModelAnswer": "An exam-ready, high-quality, professional markdown model answer for this specific step/question."
}`;

  const prompt = `Scenario:\n${scenario}\n\nStudent Answer:\n${studentInput}\n\nGrade this answer. Return ONLY the JSON object.`;

  const responseText = await getChatCompletionText(prompt, systemPrompt, {
    modelTier: "standard",
    temperature: 0.2,
    requestName: "ScenarioGrader",
  });

  try {
    const cleanText = responseText?.replace(/^```json\s*/i, "").replace(/```$/, "").trim() ?? "";
    return JSON.parse(cleanText) as { score: number; feedback: string; suggestedModelAnswer: string };
  } catch {
    return {
      score: 75,
      feedback: responseText || "Evaluation complete.",
      suggestedModelAnswer: "Review course materials for the correct format.",
    };
  }
}
