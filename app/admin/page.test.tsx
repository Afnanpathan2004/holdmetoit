import { describe, expect, it, vi } from "vitest";
import { redirect } from "next/navigation";
import AdminDashboardPage from "./page";

vi.mock("next/navigation", () => ({
   redirect: vi.fn(),
}));

describe("AdminDashboardPage", () => {
   it("redirects to /challenges", () => {
      AdminDashboardPage();
      expect(redirect).toHaveBeenCalledWith("/challenges");
   });
});
