import { test, expect } from "@playwright/test";
import fs from "node:fs/promises";

test("landing page exposes a single Try entry point", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("link", { name: "Try", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Try", exact: true })).toHaveAttribute("href", "/demo");
  await expect(page.getByRole("link", { name: "Try it", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Try it", exact: true })).toHaveAttribute("href", "/demo");
  await expect(page.getByText("Open Full Dashboard")).toHaveCount(0);
  await expect(page.getByRole("link", { name: /Dashboard/i })).toHaveCount(0);
  await expect(page.getByText("Login")).toHaveCount(0);
  await expect(page.getByText("Sign up")).toHaveCount(0);
});

test("auth routes redirect into the demo", async ({ page }) => {
  await page.goto("/login");
  await expect(page).toHaveURL(/\/demo$/);

  await page.goto("/signup");
  await expect(page).toHaveURL(/\/demo$/);
});

test("dashboard routes redirect into the demo", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/demo$/);
});

test("demo completes the guided law study loop", async ({ page }) => {
  await page.goto("/demo");

  await page.getByPlaceholder("Or paste material here: Negligence is a tort...").fill(
    "Specific performance is an equitable remedy. It may be granted where damages are inadequate. Nigerian courts consider discretion, hardship, conduct, mutuality, certainty, and whether the contract concerns unique property. Equity also uses injunctions, rescission, rectification, and remedies against breach of trust.",
  );
  await page.getByRole("button", { name: "Process Material" }).click();

  await expect(page.getByRole("heading", { name: "Choose a topic" })).toBeVisible();
  await page.getByPlaceholder("e.g. specific performance, breach of trust, injunction").fill("specific performance");
  await page.getByRole("button", { name: "Explain topic" }).click();

  await expect(page.getByRole("heading", { name: "Learn in Plain Mode" })).toBeVisible();
  await expect(page.getByText("IRAC lens")).toBeVisible();
  await expect(page.getByText("Cases and authorities to remember")).toBeVisible();
  await expect(page.getByText("Sample exam paragraphs")).toBeVisible();
  await expect(page.getByText("Common mistakes")).toBeVisible();

  const explanationWords = await page.getByTestId("plain-explanation").evaluate((node) =>
    (node.textContent ?? "").trim().split(/\s+/).filter(Boolean).length,
  );
  expect(explanationWords).toBeGreaterThanOrEqual(2000);

  await page.getByRole("button", { name: "Story Mode" }).click();
  await expect(page.getByRole("heading", { name: "Learn in Story Mode" })).toBeVisible();
  await expect(page.getByText("Tutor:")).toBeVisible();
  await expect(page.getByText("Your turn: spot the issue")).toBeVisible();
  await page.getByPlaceholder("Type your response to the tutor...").fill(
    "Whether Amadi can obtain specific performance because the bronze artifact is rare and damages may be inadequate.",
  );
  await page.getByRole("button", { name: "Submit response" }).click();
  await expect(page.getByText("Good issue spotting")).toBeVisible();
  await expect(page.getByText("Your turn: state the rule")).toBeVisible();

  await page.getByRole("button", { name: "Jump to Exam Prep" }).click();
  await expect(page.getByRole("heading", { name: "Exam Prep" })).toBeVisible();

  await page.getByPlaceholder("Write the legal issue here...").fill(
    "Whether Amadi can secure specific performance of the contract for the rare bronze artifact.",
  );
  await page.getByRole("button", { name: "Submit issue" }).click();
  await expect(page.getByText("Issue feedback")).toBeVisible();

  await page.getByPlaceholder("State the rule, cases, and statutes...").fill(
    "Specific performance is discretionary. It is granted where damages are inadequate, especially for unique property, and may be refused for hardship, uncertainty, misconduct, or lack of mutuality.",
  );
  await page.getByRole("button", { name: "Submit rule" }).click();
  await expect(page.getByText("Rule feedback")).toBeVisible();

  await page.getByPlaceholder("Apply the law and advise the party...").fill(
    "Amadi should argue that the bronze artifact is unique and historically significant, so damages and refund of deposit are inadequate. Alao should be advised that the court may compel delivery if the contract is certain and no equitable bar applies.",
  );
  await page.getByRole("button", { name: "Submit advice" }).click();

  await expect(page.getByRole("heading", { name: "Revision reward unlocked" })).toBeVisible();
  await expect(page.getByText("Overall IRAC score")).toBeVisible();
  await expect(page.getByRole("button", { name: "Download Revision PDF" })).toBeVisible();
  await expect(page.getByText("Better exam-ready version:")).toBeVisible();
});

test("demo accepts up to three uploaded materials", async ({ page }, testInfo) => {
  const filePaths = await Promise.all(
    ["negligence.txt", "duty.txt", "breach.txt", "ignored.txt"].map(async (name, index) => {
      const filePath = testInfo.outputPath(name);
      await fs.writeFile(filePath, `Material ${index + 1}: negligence, duty, breach, causation, and damage.`);
      return filePath;
    }),
  );

  await page.goto("/demo");
  await page.locator('input[type="file"]').setInputFiles(filePaths);

  await expect(page.getByText("3 of 3 materials ready")).toBeVisible();
  await expect(page.getByText("negligence.txt")).toBeVisible();
  await expect(page.getByText("duty.txt")).toBeVisible();
  await expect(page.getByText("breach.txt")).toBeVisible();
  await expect(page.getByText("ignored.txt")).toHaveCount(0);
});

test("demo asks for a topic before explaining", async ({ page }) => {
  await page.goto("/demo");

  await page.getByPlaceholder("Or paste material here: Negligence is a tort...").fill(
    "Equity provides remedies such as specific performance, injunction, rectification, rescission, and relief against breach of trust.",
  );
  await page.getByRole("button", { name: "Process Material" }).click();

  await expect(page.getByRole("heading", { name: "Choose a topic" })).toBeVisible();
  await expect(page.getByText("I have read your materials. What topic do you want me to explain?")).toBeVisible();
  await page.getByPlaceholder("e.g. specific performance, breach of trust, injunction").fill("breach of trust");
  await page.getByRole("button", { name: "Explain topic" }).click();

  await expect(page.getByRole("heading", { name: "Learn in Plain Mode" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Explain breach of trust plainly" })).toBeVisible();
});

test("demo gives judges built-in materials, suggested questions, and pass buttons", async ({ page }) => {
  await page.goto("/demo");

  await expect(page.getByText("Matey coach")).toBeVisible();
  await expect(page.getByText("Hi, I'm Matey")).toBeVisible();
  await expect(page.getByRole("button", { name: "Load demo materials" })).toBeVisible();
  await expect(page.getByText("For judges: click this to load sample Equity notes and questions instantly.")).toBeVisible();
  await page.getByRole("button", { name: "Load demo materials" }).click();
  await expect(page.getByText("Equity seminar answer")).toBeVisible();
  await page.getByRole("button", { name: "Process Material" }).click();

  await expect(page.getByRole("heading", { name: "Choose a topic" })).toBeVisible();
  await expect(page.getByText("Good job — process complete", { exact: true })).toBeVisible();
  await expect(page.getByText("+10 XP Material processed")).toBeVisible();
  await expect(page.getByText("Ask this question or custom question")).toBeVisible();
  await page.getByRole("button", { name: "Ask this question: Specific performance" }).click();
  await page.getByRole("button", { name: "Explain topic" }).click();

  await expect(page.getByRole("heading", { name: "Learn in Plain Mode" })).toBeVisible();
  await expect(page.getByTestId("plain-explanation")).not.toContainText("StudyMate should");
  await expect(page.getByTestId("plain-explanation")).not.toContainText("the app should");
  await expect(page.getByTestId("plain-explanation")).toContainText("The answer is that specific performance is an equitable remedy");

  await page.getByRole("button", { name: "Jump to Exam Prep" }).click();
  await expect(page.getByText("For demo: use Demo pass to auto-fill a good answer so judges can see the grading flow.")).toBeVisible();
  await page.getByRole("button", { name: "Demo pass: fill issue" }).click();
  await page.getByRole("button", { name: "Submit issue" }).click();
  await expect(page.getByText("+20 XP Exam issue")).toBeVisible();
  await page.getByRole("button", { name: "Demo pass: fill rule" }).click();
  await page.getByRole("button", { name: "Submit rule" }).click();
  await expect(page.getByText("+25 XP Exam rule")).toBeVisible();
  await page.getByRole("button", { name: "Demo pass: fill advice" }).click();
  await page.getByRole("button", { name: "Submit advice" }).click();

  await expect(page.getByRole("heading", { name: "Revision reward unlocked" })).toBeVisible();
  await expect(page.getByText("+50 XP Revision PDF unlocked")).toBeVisible();
});

test("story mode plays as avatar dialogue and awards XP", async ({ page }) => {
  await page.goto("/demo");

  await page.getByRole("button", { name: "Load demo materials" }).click();
  await page.getByRole("button", { name: "Process Material" }).click();
  await page.getByRole("button", { name: "Ask this question: Specific performance" }).click();
  await page.getByRole("button", { name: "Explain topic" }).click();
  await page.getByRole("button", { name: "Story Mode" }).click();

  await expect(page.getByText("Story Mode is a legal role-play")).toBeVisible();
  await expect(page.getByText("Amadi, the client")).toBeVisible();
  await expect(page.getByText("Type the legal issue as Amadi's lawyer.")).toBeVisible();
  await expect(page.getByText("For demo: use Demo pass to auto-fill the lawyer's answer and test Story Mode progression.")).toBeVisible();

  await page.getByRole("button", { name: "Demo pass: fill story answer" }).click();
  await page.getByRole("button", { name: "Submit response" }).click();
  await expect(page.getByText("+15 XP Story issue")).toBeVisible();

  await page.getByRole("button", { name: "Demo pass: fill story answer" }).click();
  await page.getByRole("button", { name: "Submit response" }).click();
  await expect(page.getByText("+20 XP Story rule")).toBeVisible();

  await page.getByRole("button", { name: "Demo pass: fill story answer" }).click();
  await page.getByRole("button", { name: "Submit response" }).click();
  await expect(page.getByText("+25 XP Story advice complete")).toBeVisible();
  await expect(page.getByText("Story Mode complete")).toBeVisible();
  await expect(page.getByText("Victory unlocked", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Continue to Exam Prep" }).click();
  await expect(page.getByRole("heading", { name: "Exam Prep" })).toBeVisible();
});
