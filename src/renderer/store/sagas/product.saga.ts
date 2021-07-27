import { put, takeEvery } from "redux-saga/effects";
import {
  GET_PRODUCT,
  GetProductAction,
  getProductSuccess,
} from "../actions/product.actions";

function* handleGetProduct({ sortBy }: GetProductAction) {
  yield put(getProductSuccess([], sortBy));
}

export default function* productSaga() {
  yield takeEvery(GET_PRODUCT, handleGetProduct);
}
