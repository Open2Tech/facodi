/**
 * Mock curricularUnit data for FACODI
 * 
 * This file contains fallback curricularUnit data for the mock data source mode.
 * In production, data is loaded from Supabase.
 * 
 * To add sample data, extend the COURSE_UNITS array with CurricularUnit objects.
 */

import { CurricularUnit, Category, Difficulty } from '../types';

export const COURSE_UNITS: CurricularUnit[] = [
  // Add mock curricularUnit data here
  // Example:
  // {
  //   id: 'unit-001',
  //   name: 'Introduction to Programming',
  //   description: 'Learn the basics of programming',
  //   ects: 6,
  //   semester: 1,
  //   year: 1,
  //   category: Category.COMPUTER_SCIENCE,
  //   difficulty: Difficulty.FOUNDATIONAL,
  //   duration: '45 hours',
  //   contributor: 'Example University',
  //   tags: ['programming', 'beginner'],
  //   courseId: 'course-001',
  // },
];
