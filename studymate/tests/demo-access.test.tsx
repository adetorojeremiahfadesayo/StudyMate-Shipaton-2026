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

describe("Demo access", () => {
  it("shows one primary Try entry point on the landing page", () => {
    render(<Home />);

    const tryLinks = screen.getAllByRole("link", { name: "Try" });
    expect(tryLinks).toHaveLength(1);
    expect(tryLinks[0]).toHaveAttribute("href", "/demo");
    expect(screen.queryByText("Login")).not.toBeInTheDocument();
    expect(screen.queryByText("Sign up")).not.toBeInTheDocument();
  });

  it("redirects auth pages to the demo", () => {
    expect(() => LoginPage()).toThrow("NEXT_REDIRECT:/demo");
    expect(() => SignupPage()).toThrow("NEXT_REDIRECT:/demo");
    expect(() => OnboardingPage()).toThrow("NEXT_REDIRECT:/demo");
  });
});
