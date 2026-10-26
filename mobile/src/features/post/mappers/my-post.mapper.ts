import { BaseMapper, pickField, safeNumber, safeString } from '@/lib/mapper';
import { recipeMapper } from '@/features/recipe/mappers/recipe.mapper';
import { videoMapper } from '@/features/video/mappers/video.mapper';
import type { PaginationResult } from '@/types/api';
import { postMapper } from './post.mapper';
import type { BasePostDto } from '../types/post.dto';
import type { MyPost } from '../types/post.model';

/**
 * `GET /posts/mine` trả hỗn hợp Recipe/Blog/Video; mỗi loại dùng lại mapper của feature đó
 * rồi rút gọn về `MyPost`, nên ảnh bìa/thumbnail giữ đúng quy tắc từng loại.
 */
export class MyPostMapper extends BaseMapper<BasePostDto, MyPost> {
  toModel(dto: BasePostDto | null | undefined): MyPost {
    const type = safeString(pickField(dto, ['type'], 'BLOG')).toUpperCase();
    if (type === 'RECIPE') {
      const recipe = recipeMapper.toModel(dto);
      return {
        id: recipe.id,
        type: 'RECIPE',
        title: recipe.title,
        excerpt: recipe.description,
        categoryName: recipe.category.name,
        coverImageUrl: recipe.coverImageUrl,
        status: recipe.status,
        statusLabel: recipe.statusLabel,
        version: recipe.version,
        formattedPublishedAt: recipe.formattedPublishedAt,
      };
    }
    if (type === 'VIDEO') {
      const video = videoMapper.toModel(dto);
      return {
        id: video.id,
        type: 'VIDEO',
        title: video.title,
        excerpt: video.excerpt,
        categoryName: video.category.name,
        coverImageUrl: video.thumbnailUrl,
        status: video.status,
        statusLabel: video.statusLabel,
        version: video.version,
        formattedPublishedAt: video.formattedPublishedAt,
      };
    }
    const article = postMapper.toModel(dto);
    return {
      id: article.id,
      type: 'BLOG',
      title: article.title,
      excerpt: article.excerpt,
      categoryName: article.category.name,
      coverImageUrl: article.coverImageUrl,
      status: article.status,
      statusLabel: article.statusLabel,
      version: article.version,
      formattedPublishedAt: article.formattedPublishedAt,
    };
  }

  toPaginationFromEnvelope(
    data: (BasePostDto | null | undefined)[] | null | undefined,
    meta?: { page?: number; limit?: number; total?: number; totalPages?: number } | null
  ): PaginationResult<MyPost> {
    const items = this.toModelList(data).filter((item) => item.id.length > 0);
    return {
      items,
      metadata: {
        page: safeNumber(meta?.page, 1),
        limit: safeNumber(meta?.limit, 20),
        totalItems: safeNumber(meta?.total, items.length),
        totalPages: safeNumber(meta?.totalPages, 1),
      },
    };
  }
}

export const myPostMapper = new MyPostMapper();
