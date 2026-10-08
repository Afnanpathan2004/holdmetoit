import { describe, expect, it } from "vitest";
import {
   moveCategoryBetweenColumns,
   moveTaskBetweenCategories,
   reorderArray,
} from "./task-reorder";
import type { CategoryGroup } from "./task.types";

describe("task-reorder domain logic", () => {
   it("reorders array elements correctly", () => {
      const list = ["A", "B", "C", "D"];
      const result = reorderArray(list, 1, 3);
      expect(result).toEqual(["A", "C", "D", "B"]);
   });

   it("returns cloned array when reorder index is out of bounds", () => {
      const list = ["A", "B"];
      expect(reorderArray(list, -1, 1)).toEqual(["A", "B"]);
      expect(reorderArray(list, 0, 5)).toEqual(["A", "B"]);
   });

   describe("moveTaskBetweenCategories", () => {
      const dailyCats: CategoryGroup[] = [
         {
            id: "cat_d1",
            name: "Cat D1",
            taskType: "DAILY",
            isCollapsed: false,
            tasks: [
               {
                  id: "t1",
                  userId: "u1",
                  categoryId: "cat_d1",
                  title: "Task 1",
                  taskType: "DAILY",
                  isComplete: false,
                  createdAt: new Date(),
                  updatedAt: new Date(),
                  completedAt: null,
               },
               {
                  id: "t2",
                  userId: "u1",
                  categoryId: "cat_d1",
                  title: "Task 2",
                  taskType: "DAILY",
                  isComplete: false,
                  createdAt: new Date(),
                  updatedAt: new Date(),
                  completedAt: null,
               },
            ],
         },
      ];

      const weeklyCats: CategoryGroup[] = [
         {
            id: "cat_w1",
            name: "Cat W1",
            taskType: "WEEKLY",
            isCollapsed: false,
            tasks: [
               {
                  id: "t3",
                  userId: "u1",
                  categoryId: "cat_w1",
                  title: "Task 3",
                  taskType: "WEEKLY",
                  isComplete: true,
                  createdAt: new Date(),
                  updatedAt: new Date(),
                  completedAt: new Date(),
               },
            ],
         },
      ];

      it("reorders tasks within the same category", () => {
         const res = moveTaskBetweenCategories({
            taskId: "t1",
            sourceCategoryIndex: 0,
            sourceColumn: "daily",
            targetCategoryIndex: 0,
            targetColumn: "daily",
            targetTaskIndex: 1,
            dailyCategories: dailyCats,
            weeklyCategories: weeklyCats,
         });

         expect(res.dailyCategories[0].tasks.map((t) => t.id)).toEqual([
            "t2",
            "t1",
         ]);
         expect(res.weeklyCategories).toEqual(weeklyCats);
      });

      it("moves task across boards from Daily to Weekly", () => {
         const res = moveTaskBetweenCategories({
            taskId: "t1",
            sourceCategoryIndex: 0,
            sourceColumn: "daily",
            targetCategoryIndex: 0,
            targetColumn: "weekly",
            targetTaskIndex: 0,
            dailyCategories: dailyCats,
            weeklyCategories: weeklyCats,
         });

         // Daily category should have lost t1
         expect(res.dailyCategories[0].tasks.map((t) => t.id)).toEqual(["t2"]);
         // Weekly category should have gained t1 at index 0 with taskType updated to WEEKLY
         expect(res.weeklyCategories[0].tasks.map((t) => t.id)).toEqual([
            "t1",
            "t3",
         ]);
         expect(res.weeklyCategories[0].tasks[0].taskType).toBe("WEEKLY");
         expect(res.weeklyCategories[0].tasks[0].categoryId).toBe("cat_w1");
      });
   });

   describe("moveCategoryBetweenColumns", () => {
      const dailyCats: CategoryGroup[] = [
         {
            id: "cat_d1",
            name: "Math",
            taskType: "DAILY",
            isCollapsed: false,
            tasks: [
               {
                  id: "t1",
                  userId: "u1",
                  categoryId: "cat_d1",
                  title: "Calculus",
                  taskType: "DAILY",
                  isComplete: false,
                  createdAt: new Date(),
                  updatedAt: new Date(),
                  completedAt: null,
               },
            ],
         },
      ];

      const weeklyCats: CategoryGroup[] = [
         {
            id: "cat_w1",
            name: "Physics",
            taskType: "WEEKLY",
            isCollapsed: false,
            tasks: [],
         },
      ];

      it("moves category from Daily to Weekly and cascades taskType", () => {
         const res = moveCategoryBetweenColumns({
            categoryIndex: 0,
            sourceColumn: "daily",
            targetColumn: "weekly",
            targetIndex: 1,
            dailyCategories: dailyCats,
            weeklyCategories: weeklyCats,
         });

         expect(res.dailyCategories).toHaveLength(0);
         expect(res.weeklyCategories).toHaveLength(2);
         expect(res.weeklyCategories[1].name).toBe("Math");
         expect(res.weeklyCategories[1].taskType).toBe("WEEKLY");
         expect(res.weeklyCategories[1].tasks[0].taskType).toBe("WEEKLY");
      });
   });
});
