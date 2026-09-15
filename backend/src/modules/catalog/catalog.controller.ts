import type { Request, Response } from 'express';
import {
  getValidatedBody,
  getValidatedParams,
  getValidatedQuery,
} from '../../common/validation/validate-request.js';
import {
  adminCategoryListResponseSchema,
  archiveResponseSchema,
  categoryResponseSchema,
  ingredientListResponseSchema,
  ingredientResolutionResponseSchema,
  ingredientResponseSchema,
  publicCategoryTreeResponseSchema,
  type AdminCategoryQuery,
  type AdminIngredientQuery,
  type AliasParams,
  type ArchiveCategoryQuery,
  type CreateCategoryInput,
  type CreateIngredientAliasInput,
  type CreateIngredientInput,
  type IdParams,
  type PublicCategoryQuery,
  type PublicIngredientQuery,
  type ResolveIngredientQuery,
  type UpdateCategoryInput,
  type UpdateIngredientInput,
} from './catalog.schemas.js';
import type { CatalogService } from './catalog.service.js';

export class CatalogController {
  constructor(private readonly service: CatalogService) {}

  listPublicCategories = async (request: Request, response: Response): Promise<void> => {
    const data = await this.service.listPublicCategories(
      getValidatedQuery<PublicCategoryQuery>(request),
    );
    response
      .status(200)
      .json(publicCategoryTreeResponseSchema.parse({ success: true, data, meta: null }));
  };

  listAdminCategories = async (request: Request, response: Response): Promise<void> => {
    const result = await this.service.listAdminCategories(
      getValidatedQuery<AdminCategoryQuery>(request),
    );
    response.status(200).json(
      adminCategoryListResponseSchema.parse({
        success: true,
        data: result.data,
        meta: result.meta,
      }),
    );
  };

  createCategory = async (request: Request, response: Response): Promise<void> => {
    const data = await this.service.createCategory(getValidatedBody<CreateCategoryInput>(request));
    response.status(201).json(categoryResponseSchema.parse({ success: true, data, meta: null }));
  };

  updateCategory = async (request: Request, response: Response): Promise<void> => {
    const { id } = getValidatedParams<IdParams>(request);
    const data = await this.service.updateCategory(
      id,
      getValidatedBody<UpdateCategoryInput>(request),
    );
    response.status(200).json(categoryResponseSchema.parse({ success: true, data, meta: null }));
  };

  archiveCategory = async (request: Request, response: Response): Promise<void> => {
    const { id } = getValidatedParams<IdParams>(request);
    const data = await this.service.archiveCategory(
      id,
      getValidatedQuery<ArchiveCategoryQuery>(request),
    );
    response.status(200).json(archiveResponseSchema.parse({ success: true, data, meta: null }));
  };

  listPublicIngredients = async (request: Request, response: Response): Promise<void> => {
    const result = await this.service.listPublicIngredients(
      getValidatedQuery<PublicIngredientQuery>(request),
    );
    response.status(200).json(
      ingredientListResponseSchema.parse({
        success: true,
        data: result.data,
        meta: result.meta,
      }),
    );
  };

  resolveIngredient = async (request: Request, response: Response): Promise<void> => {
    const data = await this.service.resolveIngredient(
      getValidatedQuery<ResolveIngredientQuery>(request),
    );
    response
      .status(200)
      .json(ingredientResolutionResponseSchema.parse({ success: true, data, meta: null }));
  };

  listAdminIngredients = async (request: Request, response: Response): Promise<void> => {
    const result = await this.service.listAdminIngredients(
      getValidatedQuery<AdminIngredientQuery>(request),
    );
    response.status(200).json(
      ingredientListResponseSchema.parse({
        success: true,
        data: result.data,
        meta: result.meta,
      }),
    );
  };

  createIngredient = async (request: Request, response: Response): Promise<void> => {
    const data = await this.service.createIngredient(
      getValidatedBody<CreateIngredientInput>(request),
    );
    response.status(201).json(ingredientResponseSchema.parse({ success: true, data, meta: null }));
  };

  updateIngredient = async (request: Request, response: Response): Promise<void> => {
    const { id } = getValidatedParams<IdParams>(request);
    const data = await this.service.updateIngredient(
      id,
      getValidatedBody<UpdateIngredientInput>(request),
    );
    response.status(200).json(ingredientResponseSchema.parse({ success: true, data, meta: null }));
  };

  archiveIngredient = async (request: Request, response: Response): Promise<void> => {
    const { id } = getValidatedParams<IdParams>(request);
    const data = await this.service.archiveIngredient(id);
    response.status(200).json(archiveResponseSchema.parse({ success: true, data, meta: null }));
  };

  addIngredientAlias = async (request: Request, response: Response): Promise<void> => {
    const { id } = getValidatedParams<IdParams>(request);
    const data = await this.service.addIngredientAlias(
      id,
      getValidatedBody<CreateIngredientAliasInput>(request),
    );
    response.status(201).json(ingredientResponseSchema.parse({ success: true, data, meta: null }));
  };

  deleteIngredientAlias = async (request: Request, response: Response): Promise<void> => {
    const { id, aliasId } = getValidatedParams<AliasParams>(request);
    await this.service.deleteIngredientAlias(id, aliasId);
    response.status(204).send();
  };
}
