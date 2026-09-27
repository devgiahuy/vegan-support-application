import type { MealProgramGoalDto, MealProgramStatusDto } from './meal-program.dto';

export interface MealProgramWeek {
  id: string;
  weekIndex: number;
  status: string;
  selectedAlternativeRank: number | null;
}

export interface MealProgram {
  id: string;
  title: string;
  goal: MealProgramGoalDto;
  goalLabel: string;
  startDate: string;
  endDate: string;
  timezone: string;
  horizonWeeks: number;
  status: MealProgramStatusDto;
  statusLabel: string;
  version: number;
  readyWeeks: number;
  failedWeeks: number;
  confirmedAt: string | null;
  weeks: MealProgramWeek[];
  warningCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface MealProgramListResult {
  items: MealProgram[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
}

export interface CreateMealProgramInput {
  title: string;
  goal: MealProgramGoalDto;
  startDate: string;
  horizonWeeks: number;
  alternativesPerWeek?: number;
  seed?: string;
}

