export type TaskType = "DAILY" | "WEEKLY";

export interface TaskItem {
  id: string;
  userId: string;
  categoryId: string;
  title: string;
  taskType: TaskType;
  isComplete: boolean;
  createdAt: Date;
  updatedAt: Date;
  completedAt: Date | null;
}

export interface CategoryItem {
  id: string;
  userId: string;
  name: string;
  taskType: TaskType;
  createdAt: Date;
  updatedAt: Date;
}

export interface CategoryGroup {
  id: string;
  name: string;
  taskType: TaskType;
  isCollapsed: boolean;
  tasks: TaskItem[];
}

export interface UserCategorizedTasks {
  categories: CategoryItem[];
  dailyCategories: CategoryGroup[];
  weeklyCategories: CategoryGroup[];
  totalDailyTasks: number;
  completedDailyTasks: number;
  totalWeeklyTasks: number;
  completedWeeklyTasks: number;
}
