import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import Home from "@/app/page";
import LoginPage from "@/app/(auth)/login/page";
import SignupPage from "@/app/(auth)/signup/page";
import OnboardingPage from "@/app/(auth)/onboarding/page";

const { redirectMock } = vi.hoisted(() => ({
  redirectMock: vi.fn((path: string) => {
    throw new Error(`NEXT_REDIRECT:${path}`);
  }),
}));

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

vi.mock("@/lib/supabase", () => ({ supabase: { auth: { signInWithPassword: vi.fn() } } }));

describe("Demo access", () => {
  it("shows one primary Try entry point on the landing page", () => {
    render(<Home />);

    const tryLinks = screen.getAllByRole("link", { name: "Try" });
    expect(tryLinks).toHaveLength(1);
    expect(tryLinks[0]).toHaveAttribute("href", "/demo");
    expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute("href", "/login");
    expect(screen.queryByText("Login")).not.toBeInTheDocument();
    expect(screen.queryByText("Sign up")).not.toBeInTheDocument();
  });

  it("keeps judge sign-in alongside the sample demo", () => {
    render(<LoginPage />);
    expect(screen.getByRole("button", { name: "Sign in" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Try the sample demo" })).toHaveAttribute("href", "/demo");
  });

  it("keeps the existing signup and onboarding demo entry", () => {
    expect(() => SignupPage()).toThrow("NEXT_REDIRECT:/demo");
    expect(() => OnboardingPage()).toThrow("NEXT_REDIRECT:/demo");
  });
});
