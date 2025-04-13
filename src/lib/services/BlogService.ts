import { db } from '@/lib/firebase/config';
import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { User } from 'firebase/auth';

// Blog Post Status Enum
export enum BlogPostStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
}

// Blog Post Interface
export interface BlogPost {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string; // Store author's display name for easier display
  createdAt: Timestamp;
  updatedAt: Timestamp;
  publishedAt?: Timestamp | null; // Timestamp when the post was published
  status: BlogPostStatus;
}

export class BlogService {
  private static instance: BlogService;
  private postsCollection = collection(db, 'blogPosts');

  private constructor() {}

  public static getInstance(): BlogService {
    if (!BlogService.instance) {
      BlogService.instance = new BlogService();
    }
    return BlogService.instance;
  }

  // Create a new blog post
  async createPost(
    title: string,
    content: string,
    author: User,
    initialStatus: BlogPostStatus = BlogPostStatus.DRAFT
  ): Promise<string> {
    try {
      const docRef = await addDoc(this.postsCollection, {
        title,
        content,
        authorId: author.uid,
        authorName: author.displayName || author.email, // Use displayName or email
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        publishedAt: initialStatus === BlogPostStatus.PUBLISHED ? serverTimestamp() : null,
        status: initialStatus,
      });
      return docRef.id;
    } catch (error) {
      console.error("Error creating blog post: ", error);
      throw new Error("Blog yazısı oluşturulamadı.");
    }
  }

  // Get all blog posts (consider pagination for large amounts)
  async getAllPosts(): Promise<BlogPost[]> {
    try {
      const q = query(this.postsCollection, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      } as BlogPost));
    } catch (error) {
      console.error("Error getting all blog posts: ", error);
      throw new Error("Blog yazıları alınamadı.");
    }
  }

  // Get a single blog post by ID
  async getPostById(postId: string): Promise<BlogPost | null> {
    try {
      const docRef = doc(db, 'blogPosts', postId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as BlogPost;
      } else {
        return null;
      }
    } catch (error) {
      console.error("Error getting blog post by ID: ", error);
      throw new Error("Blog yazısı bulunamadı.");
    }
  }

  // Update a blog post (only title, content, and status)
  async updatePost(
    postId: string,
    updates: { title?: string; content?: string; status?: BlogPostStatus }
  ): Promise<void> {
    try {
      const docRef = doc(db, 'blogPosts', postId);
      const updateData: any = { ...updates, updatedAt: serverTimestamp() };

      // If status is changing to published, set publishedAt
      if (updates.status === BlogPostStatus.PUBLISHED) {
         // We should probably check if it wasn't already published to avoid resetting the date
         // For simplicity now, we just set it. Consider fetching the doc first for a robust check.
         updateData.publishedAt = serverTimestamp();
      } else if (updates.status === BlogPostStatus.DRAFT) {
         // If changing back to draft, clear publishedAt
         updateData.publishedAt = null;
      }


      await updateDoc(docRef, updateData);
    } catch (error) {
      console.error("Error updating blog post: ", error);
      throw new Error("Blog yazısı güncellenemedi.");
    }
  }

   // Update only the status of a blog post
   async updatePostStatus(postId: string, status: BlogPostStatus): Promise<void> {
     try {
       const docRef = doc(db, 'blogPosts', postId);
       const updateData: any = {
         status: status,
         updatedAt: serverTimestamp(),
         publishedAt: status === BlogPostStatus.PUBLISHED ? serverTimestamp() : null,
       };

       // If changing back to draft, ensure publishedAt is cleared.
        if (status === BlogPostStatus.DRAFT) {
            updateData.publishedAt = null;
        } else {
            // Fetch the document first to avoid overwriting an existing publishedAt if already published
             const currentPost = await this.getPostById(postId);
             if (currentPost && currentPost.status !== BlogPostStatus.PUBLISHED) {
                 updateData.publishedAt = serverTimestamp();
             } else if (currentPost && currentPost.publishedAt) {
                 // Keep existing publishedAt if already published
                 updateData.publishedAt = currentPost.publishedAt;
             }
             else {
                 // Fallback if fetch fails or post doesn't exist (shouldn't happen ideally)
                  updateData.publishedAt = serverTimestamp();
             }
        }


       await updateDoc(docRef, updateData);
     } catch (error) {
       console.error("Error updating blog post status: ", error);
       throw new Error("Blog yazısı durumu güncellenemedi.");
     }
   }

}

// Singleton instance
export const blogService = BlogService.getInstance(); 