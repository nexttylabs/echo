/*
 * Copyright (c) 2026 Echo Team
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

import { describe, expect, it, mock } from "bun:test";
import { render } from "@testing-library/react";
import { ProfileForm } from "@/components/settings/profile-form";
import "../setup";

// Mock translations
const translations: Record<string, string> = {
  cardTitle: "Personal Information",
  cardDescription: "Update your personal details",
  nameLabel: "Name",
  namePlaceholder: "Enter your name",
  nameRequired: "Name is required",
  nameTooLong: "Name must be 100 characters or less",
  emailLabel: "Email",
  emailNote: "Email address cannot be changed",
  saveChanges: "Save Changes",
  updating: "Saving...",
  updateSuccess: "Profile updated successfully",
  updateFailed: "Failed to update profile",
};

mock.module("next-intl", () => ({
  useTranslations: () => (key: string) => translations[key] ?? key,
}));

// Mock authClient
mock.module("@/lib/auth/client", () => ({
  authClient: {
    useSession: () => ({
      data: {
        user: {
          id: "test-user-id",
          name: "Test User",
          email: "test@example.com",
          image: null,
        },
      },
      refetch: () => Promise.resolve(),
    }),
    updateUser: () => Promise.resolve(),
  },
}));

// Mock UI components
mock.module("@/components/ui/card", () => ({
  Card: ({ children }: { children: React.ReactNode }) => <div data-testid="card">{children}</div>,
  CardHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardTitle: ({ children }: { children: React.ReactNode }) => <h3>{children}</h3>,
  CardDescription: ({ children }: { children: React.ReactNode }) => <p>{children}</p>,
  CardContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

mock.module("@/components/ui/label", () => ({
  Label: ({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) => (
    <label htmlFor={htmlFor}>{children}</label>
  ),
}));

mock.module("@/components/ui/input", () => ({
  Input: (props: React.InputHTMLAttributes<HTMLInputElement>) => <input {...props} />,
}));

mock.module("@/components/ui/button", () => ({
  Button: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { children: React.ReactNode }) => (
    <button {...props}>{children}</button>
  ),
}));

describe("ProfileForm", () => {
  it("renders the profile form with user data", () => {
    const { getByText, getAllByDisplayValue } = render(<ProfileForm />);

    // Check that form titles are rendered
    expect(getByText("Personal Information")).toBeDefined();
    expect(getByText("Update your personal details")).toBeDefined();

    // Check that user data is displayed
    const nameInputs = getAllByDisplayValue("Test User");
    const emailInputs = getAllByDisplayValue("test@example.com");
    expect(nameInputs.length).toBeGreaterThan(0);
    expect(emailInputs.length).toBeGreaterThan(0);
  });

  it("renders the save button", () => {
    const { getAllByText } = render(<ProfileForm />);
    const saveButtons = getAllByText("Save Changes");
    expect(saveButtons.length).toBeGreaterThan(0);
  });

  it("disables save button initially when form is not dirty", () => {
    const { getAllByText } = render(<ProfileForm />);
    const saveButtons = getAllByText("Save Changes");
    const saveButton = saveButtons[0].closest("button");
    // Button is disabled initially because isDirty is false
    expect(saveButton?.disabled).toBe(true);
  });

  it("disables email input field", () => {
    const { getAllByDisplayValue } = render(<ProfileForm />);
    const emailInputs = getAllByDisplayValue("test@example.com");
    const emailInput = emailInputs[0];
    expect(emailInput.hasAttribute("disabled")).toBe(true);
  });

  it("shows email note explaining email cannot be changed", () => {
    const { getAllByText } = render(<ProfileForm />);
    const notes = getAllByText("Email address cannot be changed");
    expect(notes.length).toBeGreaterThan(0);
  });

  it("renders name input with placeholder", () => {
    const { getAllByPlaceholderText } = render(<ProfileForm />);
    const inputs = getAllByPlaceholderText("Enter your name");
    expect(inputs.length).toBeGreaterThan(0);
  });

  it("renders within a card component", () => {
    const { getAllByTestId } = render(<ProfileForm />);
    const cards = getAllByTestId("card");
    expect(cards.length).toBeGreaterThan(0);
  });
});
