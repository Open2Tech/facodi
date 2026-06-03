/**
 * Blog posts data and functions for FACODI
 * 
 * This module provides access to blog post metadata and content.
 */

export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  author: string;
  tags: string[];
  content?: string;
  published?: boolean;
}

// Sample blog posts - extend this with actual content
const blogPosts: Record<string, BlogPost> = {};

/**
 * Get a blog post by its slug
 * @param slug The blog post slug
 * @returns The blog post or undefined if not found
 */
export function getPostBySlug(slug: string): BlogPost | undefined {
  return blogPosts[slug];
}

/**
 * Get all published blog posts
 * @returns Array of all published blog posts
 */
export function getPublishedPosts(): BlogPost[] {
  return Object.values(blogPosts).filter(post => post.published !== false);
}

/**
 * Get all blog posts
 * @returns Array of all blog posts
 */
export function getAllPosts(): BlogPost[] {
  return Object.values(blogPosts);
}

/**
 * Add a blog post (used for runtime additions)
 * @param post The blog post to add
 */
export function addPost(post: BlogPost): void {
  blogPosts[post.slug] = post;
}
