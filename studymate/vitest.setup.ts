import "@testing-library/jest-dom/vitest";
// Legacy regression fixtures do not contain commerce tables. Commerce tests enable the flag explicitly.
process.env.STUDYMATE_METERING_ENABLED = 'false';
