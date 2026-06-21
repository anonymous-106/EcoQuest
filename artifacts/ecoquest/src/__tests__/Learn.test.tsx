// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import Learn from "../pages/Learn";

describe("Learn page", () => {
  it("renders the Learning Hub heading", () => {
    render(<Learn />);
    expect(screen.getByText("Learning Hub")).toBeInTheDocument();
  });

  it("renders the subtitle description", () => {
    render(<Learn />);
    expect(
      screen.getByText(/Knowledge is the first step to action/i),
    ).toBeInTheDocument();
  });

  it("renders exactly 4 article cards", () => {
    render(<Learn />);
    const readMoreLinks = screen.getAllByText(/Read full article/i);
    expect(readMoreLinks).toHaveLength(4);
  });

  it("renders all expected article titles", () => {
    render(<Learn />);
    expect(
      screen.getByText("Understanding Your Carbon Footprint"),
    ).toBeInTheDocument();
    expect(screen.getByText("The Impact of Fast Fashion")).toBeInTheDocument();
    expect(screen.getByText("Water Conservation at Home")).toBeInTheDocument();
    expect(
      screen.getByText("Plant-Based Diets & The Planet"),
    ).toBeInTheDocument();
  });

  it("renders category labels", () => {
    render(<Learn />);
    expect(screen.getByText("Basics")).toBeInTheDocument();
    expect(screen.getByText("Lifestyle")).toBeInTheDocument();
    expect(screen.getByText("Home")).toBeInTheDocument();
    expect(screen.getByText("Food")).toBeInTheDocument();
  });

  it("renders read-time labels", () => {
    render(<Learn />);
    expect(screen.getByText("5 min read")).toBeInTheDocument();
    expect(screen.getByText("7 min read")).toBeInTheDocument();
  });

  it("renders article content summaries", () => {
    render(<Learn />);
    expect(
      screen.getByText(/A carbon footprint is the total amount/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/The fashion industry is responsible/i),
    ).toBeInTheDocument();
  });
});
