import type { Request, Response } from 'express';
import {
  getValidatedBody,
  getValidatedParams,
  getValidatedQuery,
} from '../../common/validation/validate-request.js';
import {
  foodDataImportResponseSchema,
  foodDataListResponseSchema,
  foodDataRecordResponseSchema,
  type AdminFoodDataRecordQuery,
  type CommitFoodDataImportInput,
  type CreateFoodDataRecordInput,
  type FoodDataIdParams,
  type FoodDataReadQuery,
  type FoodDataRecordKindQuery,
  type IngredientFoodDataParams,
  type IngredientNutrientQuery,
  type PreviewFoodDataImportInput,
} from './food-data.schemas.js';
import type { FoodDataService } from './food-data.service.js';

export class FoodDataController {
  constructor(private readonly service: FoodDataService) {}

  getIngredientNutrients = async (request: Request, response: Response): Promise<void> => {
    const { ingredientId } = getValidatedParams<IngredientFoodDataParams>(request);
    const data = await this.service.getIngredientNutrients(
      ingredientId,
      getValidatedQuery<IngredientNutrientQuery>(request),
    );
    response
      .status(200)
      .json(foodDataRecordResponseSchema.parse({ success: true, data, meta: null }));
  };

  listReferenceIntakes = async (request: Request, response: Response): Promise<void> => {
    this.sendList(
      response,
      await this.service.listReferenceIntakes(getValidatedQuery<FoodDataReadQuery>(request)),
    );
  };

  listGuidelines = async (request: Request, response: Response): Promise<void> => {
    this.sendList(
      response,
      await this.service.listGuidelines(getValidatedQuery<FoodDataReadQuery>(request)),
    );
  };

  listCookingMethods = async (request: Request, response: Response): Promise<void> => {
    this.sendList(
      response,
      await this.service.listCookingMethods(getValidatedQuery<FoodDataReadQuery>(request)),
    );
  };

  listInteractionRules = async (request: Request, response: Response): Promise<void> => {
    this.sendList(
      response,
      await this.service.listInteractionRules(getValidatedQuery<FoodDataReadQuery>(request)),
    );
  };

  listAdminRecords = async (request: Request, response: Response): Promise<void> => {
    this.sendList(
      response,
      await this.service.listAdminRecords(getValidatedQuery<AdminFoodDataRecordQuery>(request)),
    );
  };

  createRecord = async (request: Request, response: Response): Promise<void> => {
    const data = await this.service.createRecord(
      getValidatedBody<CreateFoodDataRecordInput>(request),
      requireActor(request),
    );
    response
      .status(201)
      .json(foodDataRecordResponseSchema.parse({ success: true, data, meta: null }));
  };

  replaceRecord = async (request: Request, response: Response): Promise<void> => {
    const { id } = getValidatedParams<FoodDataIdParams>(request);
    const data = await this.service.replaceRecord(
      id,
      getValidatedBody<CreateFoodDataRecordInput>(request),
      requireActor(request),
    );
    response
      .status(200)
      .json(foodDataRecordResponseSchema.parse({ success: true, data, meta: null }));
  };

  archiveRecord = async (request: Request, response: Response): Promise<void> => {
    const { id } = getValidatedParams<FoodDataIdParams>(request);
    const { kind } = getValidatedQuery<FoodDataRecordKindQuery>(request);
    const data = await this.service.archiveRecord(kind, id, requireActor(request));
    response
      .status(200)
      .json(foodDataRecordResponseSchema.parse({ success: true, data, meta: null }));
  };

  previewImport = async (request: Request, response: Response): Promise<void> => {
    const data = await this.service.previewImport(
      getValidatedBody<PreviewFoodDataImportInput>(request),
      requireActor(request),
    );
    response
      .status(200)
      .json(foodDataImportResponseSchema.parse({ success: true, data, meta: null }));
  };

  commitImport = async (request: Request, response: Response): Promise<void> => {
    const data = await this.service.commitImport(
      getValidatedBody<CommitFoodDataImportInput>(request),
      requireActor(request),
    );
    response
      .status(201)
      .json(foodDataImportResponseSchema.parse({ success: true, data, meta: null }));
  };

  private sendList(
    response: Response,
    result: { data: Record<string, unknown>[]; meta: Record<string, number> },
  ): void {
    response
      .status(200)
      .json(
        foodDataListResponseSchema.parse({ success: true, data: result.data, meta: result.meta }),
      );
  }
}

function requireActor(request: Request): string {
  if (!request.auth) throw new Error('Authenticated actor missing after authorization middleware');
  return request.auth.userId;
}
