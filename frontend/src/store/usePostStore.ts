import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Post, PostStatus } from '@/features/post/types/post.model';
import { MOCK_POSTS } from '@/features/post/data/mock-posts';

interface PostState {
  posts: Post[];
  addPost: (
    post: Omit<Post, 'id' | 'slug' | 'publishedAt' | 'views' | 'score' | 'commentCount'> &
      Partial<Pick<Post, 'id' | 'slug' | 'publishedAt' | 'views' | 'score' | 'commentCount'>>
  ) => Post;
  updatePost: (id: string, updated: Partial<Post>) => void;
  deletePost: (id: string) => void;
  votePost: (id: string, delta: number) => void;
  toggleSavePost: (id: string) => void;
  getPostById: (id: string) => Post | undefined;
  resetToMock: () => void;
}

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

function getStatusLabel(status: PostStatus, role?: string): string {
  if (status === 'DRAFT') return 'Bản nháp';
  if (status === 'PENDING') return 'Chờ chuyên gia duyệt';
  if (status === 'FLAGGED') return 'Cần chỉnh sửa';
  if (role === 'NUTRITION_EXPERT') return 'Đã kiểm chứng';
  return 'Đã xuất bản';
}

export const usePostStore = create<PostState>()(
  persist(
    (set, get) => ({
      posts: MOCK_POSTS,

      addPost: (newPostData) => {
        const now = new Date();
        const dateStr = `${String(now.getDate()).padStart(2, '0')}/${String(
          now.getMonth() + 1
        ).padStart(2, '0')}/${now.getFullYear()}`;

        const id = newPostData.id || `p_${Date.now()}`;
        const slug = newPostData.slug || `${slugify(newPostData.title || 'bai-viet')}-${id}`;
        const status = newPostData.status || 'PENDING';
        const statusLabel =
          newPostData.statusLabel || getStatusLabel(status, newPostData.author?.role);

        const newPost: Post = {
          id,
          title: newPostData.title,
          slug,
          summary: newPostData.summary,
          contentMarkdown: newPostData.contentMarkdown,
          coverImage:
            newPostData.coverImage ||
            'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&q=80',
          category: newPostData.category || 'Kinh nghiệm ăn chay',
          dietSchool: newPostData.dietSchool || 'THUAN_CHAY',
          tags: newPostData.tags || [],
          status,
          statusLabel,
          moderationReason:
            status === 'PENDING'
              ? 'Bài viết đang chờ Chuyên gia Dinh dưỡng kiểm chứng và duyệt xuất bản'
              : undefined,
          author: newPostData.author,
          readingMinutes: newPostData.readingMinutes || 4,
          publishedAt: dateStr,
          views: newPostData.views || 0,
          score: newPostData.score || 0,
          commentCount: newPostData.commentCount || 0,
          saved: false,
        };

        set((state) => ({
          posts: [newPost, ...state.posts],
        }));

        return newPost;
      },

      updatePost: (id, updated) => {
        set((state) => ({
          posts: state.posts.map((p) => {
            if (p.id !== id) return p;
            const status = updated.status || p.status;
            return {
              ...p,
              ...updated,
              statusLabel:
                updated.statusLabel ||
                getStatusLabel(status, updated.author?.role || p.author.role),
              updatedAt: 'Vừa xong',
            };
          }),
        }));
      },

      deletePost: (id) => {
        set((state) => ({
          posts: state.posts.filter((p) => p.id !== id),
        }));
      },

      votePost: (id, delta) => {
        set((state) => ({
          posts: state.posts.map((p) =>
            p.id === id ? { ...p, score: Math.max(0, p.score + delta) } : p
          ),
        }));
      },

      toggleSavePost: (id) => {
        set((state) => ({
          posts: state.posts.map((p) => (p.id === id ? { ...p, saved: !p.saved } : p)),
        }));
      },

      getPostById: (id) => {
        return get().posts.find((p) => p.id === id || p.slug === id);
      },

      resetToMock: () => {
        set({ posts: MOCK_POSTS });
      },
    }),
    {
      name: 'veggieconnect-posts-storage',
    }
  )
);
