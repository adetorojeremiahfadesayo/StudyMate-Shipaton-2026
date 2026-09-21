export const disciplineOptions = [
  { value: "law", label: "Law" },
  { value: "engineering", label: "Engineering" },
  { value: "medicine", label: "Medicine" },
  { value: "economics", label: "Economics" },
  { value: "other", label: "Other" },
] as const;

export type DisciplineValue = (typeof disciplineOptions)[number]["value"];

export function isDisciplineValue(value: string): value is DisciplineValue {
  return disciplineOptions.some((option) => option.value === value);
}
