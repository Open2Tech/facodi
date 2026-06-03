/**
 * Mock course (degree) data for FACODI
 * 
 * This file contains fallback course data for the mock data source mode.
 * In production, data is loaded from Supabase.
 * 
 * To add sample data, extend the DEGREES array with Course objects.
 */

import { Course } from '../types';

export const DEGREES: Course[] = [
  // Add mock course data here
  // Example:
  // {
  //   id: 'course-001',
  //   title: 'Bachelor of Computer Science',
  //   description: 'A comprehensive program in computer science',
  //   ects: 180,
  //   semesters: 6,
  //   institution: 'Example University',
  //   school: 'School of Engineering',
  //   degreeType: 'bachelor',
  //   language: 'Portuguese',
  //   longDescription: 'Detailed description of the program...',
  // },
];
