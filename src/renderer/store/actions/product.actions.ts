import { Product } from "../models/product";
export const GET_PRODUCT = "GET_PRODUCT";
export const GET_PRODUCT_SUCCESS = "GET_PRODUCT_SUCCESS";

export interface GetProductAction {
  type: typeof GET_PRODUCT;
  sortBy: string;
  order: string;
  limit: number;
}

export interface GetProductSuccessAction {
  type: typeof GET_PRODUCT_SUCCESS;
  payload: Product[];
  sortBy: string;
}

export const getProduct = (
  sortBy: string,
  order = "desc",
  limit = 10
): GetProductAction => ({
  type: GET_PRODUCT,
  sortBy,
  order,
  limit,
});

export const getProductSuccess = (
  payload: Product[],
  sortBy: string
): GetProductSuccessAction => ({
  type: GET_PRODUCT_SUCCESS,
  payload,
  sortBy,
});

/**
 * 搜索商品
 */

export const SEARCH_PRODUCT = "SEARCH_PRODUCT";
export const SEARCH_PRODUCT_SUCCESS = "SEARCH_PRODUCT_SUCCESS";

export interface SearchProductAction {
  type: typeof SEARCH_PRODUCT;
  payload: {
    category: string;
    search: string;
  };
}

export interface SearchProductSuccessAction {
  type: typeof SEARCH_PRODUCT_SUCCESS;
  products: Product[];
}

export const searchProduct = (payload: {
  category: string;
  search: string;
}): SearchProductAction => ({
  type: SEARCH_PRODUCT,
  payload,
});

export const SearchProductSuccess = (
  products: Product[]
): SearchProductSuccessAction => ({
  type: SEARCH_PRODUCT_SUCCESS,
  products,
});

/**
 * 和筛选相关的action
 */

export const FILTER_PRODUCT = "FILTER_PRODUCT";
export const FILTER_PRODUCT_SUCCESS = "FILTER_PRODUCT_SUCCESS";

export interface FilterPayload {
  order?: string;
  sortBy?: string;
  limit?: number;
  skip: number;
  filters?: {
    category: string[];
    price: number[];
  };
}

export interface FilterProductAction {
  type: typeof FILTER_PRODUCT;
  payload: FilterPayload;
}

export interface FilterProductSuccessAction {
  type: typeof FILTER_PRODUCT_SUCCESS;
  payload: {
    size: number;
    data: Product[];
  };
  skip: number;
}

export const filterProduct = (payload: FilterPayload): FilterProductAction => ({
  type: FILTER_PRODUCT,
  payload,
});
export const filterProductSuccess = (
  payload: {
    size: number;
    data: Product[];
  },
  skip: number
): FilterProductSuccessAction => ({
  type: FILTER_PRODUCT_SUCCESS,
  payload,
  skip,
});

// 通过产品id获取产品详情
export const GET_PRODUCT_BY_ID = "GET_PRODUCT_BY_ID";
export const GET_PRODUCT_BY_ID_SUCCESS = "GET_PRODUCT_BY_ID_SUCCESS";

export interface GetProductByIdAction {
  type: typeof GET_PRODUCT_BY_ID;
  payload: {
    productId: string;
  };
}

export interface GetProductByIdSuccessAction {
  type: typeof GET_PRODUCT_BY_ID_SUCCESS;
  payload: Product;
}

export const getProductById = (payload: {
  productId: string;
}): GetProductByIdAction => ({
  type: GET_PRODUCT_BY_ID,
  payload,
});

export const getProductByIdSuccess = (
  payload: Product
): GetProductByIdSuccessAction => ({
  type: GET_PRODUCT_BY_ID_SUCCESS,
  payload,
});

export type ProductUnionType =
  | GetProductAction
  | GetProductSuccessAction
  | SearchProductAction
  | SearchProductSuccessAction
  | FilterProductAction
  | FilterProductSuccessAction
  | GetProductByIdAction
  | GetProductByIdSuccessAction;
