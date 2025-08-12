import { all, fork } from 'redux-saga/effects';
import { stockSaga } from './stockSaga';

export function* rootSaga() {
  yield all([
    fork(stockSaga),
  ]);
}
