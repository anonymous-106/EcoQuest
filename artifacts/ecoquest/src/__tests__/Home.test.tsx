// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Router } from "wouter";
import Home from "../pages/Home";

function renderWithRouter(ui: React.ReactElement) {
  return render(<Router base="">{ui}</Router>);
}

describe("Home (landing) page", () => {
  it("renders the EcoQuest brand name", () => {
    renderWithRouter(<Home />);
    expect(screen.getAllByText(/EcoQuest/i).length).toBeGreaterThan(0);
  });

  it("renders the main hero heading", () => {
    renderWithRouter(<Home />);
    expect(screen.getByText(/Track your footprint/i)).toBeInTheDocument();
  });

  it("renders the 'Change your future' tagline", () => {
    renderWithRouter(<Home />);
    expect(screen.getByText(/Change your future/i)).toBeInTheDocument();
  });

  it("renders the hero subtitle about EcoQuest", () => {
    renderWithRouter(<Home />);
    expect(screen.getByText(/EcoQuest is your personal/i)).toBeInTheDocument();
  });

  it("renders 'Start Your Journey' call-to-action button", () => {
    renderWithRouter(<Home />);
    expect(screen.getByTestId("btn-hero-signup")).toHaveTextContent(/Start Your Journey/i);
  });

  it("renders 'Calculate Free' call-to-action button", () => {
    renderWithRouter(<Home />);
    expect(screen.getByTestId("btn-hero-calc")).toHaveTextContent(/Calculate Free/i);
  });

  it("renders the Sign In navigation link", () => {
    renderWithRouter(<Home />);
    expect(screen.getByTestId("link-signin")).toBeInTheDocument();
  });

  it("renders the Get Started navigation link", () => {
    renderWithRouter(<Home />);
    expect(screen.getByTestId("link-signup")).toBeInTheDocument();
  });

  it("renders the 'AI-Powered' feature badge", () => {
    renderWithRouter(<Home />);
    expect(screen.getByText("AI-Powered")).toBeInTheDocument();
  });

  it("renders the 'Global Community' feature badge", () => {
    renderWithRouter(<Home />);
    expect(screen.getByText("Global Community")).toBeInTheDocument();
  });

  it("renders the 'Real Impact' feature badge", () => {
    renderWithRouter(<Home />);
    expect(screen.getByText("Real Impact")).toBeInTheDocument();
  });

  it("renders the 'How it works' features section heading", () => {
    renderWithRouter(<Home />);
    expect(screen.getByText(/How it works/i)).toBeInTheDocument();
  });

  it("renders the 'Measure' step card", () => {
    renderWithRouter(<Home />);
    expect(screen.getByText("Measure")).toBeInTheDocument();
  });

  it("renders the 'Act' step card", () => {
    renderWithRouter(<Home />);
    expect(screen.getByText("Act")).toBeInTheDocument();
  });

  it("renders the 'Earn' step card", () => {
    renderWithRouter(<Home />);
    expect(screen.getByText("Earn")).toBeInTheDocument();
  });
});
