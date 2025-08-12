import { call, put, takeEvery } from 'redux-saga/effects';
import axios, { AxiosResponse } from 'axios';
import {
  fetchTrendingMessagesStart,
  fetchTrendingMessagesSuccess,
  fetchTrendingMessagesFailure,
  StockMessage,
} from '../slices/stockSlice';

interface StockTwitsResponse {
  response: {
    status: number;
  };
  messages: StockMessage[];
  cursor: {
    more: boolean;
    since: number;
    max: number;
  };
}

function* fetchTrendingMessages(action: ReturnType<typeof fetchTrendingMessagesStart>) {
  try {
    const symbol = action.payload;
    const isDev = process.env.NODE_ENV === 'development';
    const url = isDev
      ? `/stocktwits/api/2/trending_messages/symbol/${symbol}.json?filter=all&limit=100`
      : `/api/trending_messages/symbol/${symbol}.json?filter=all&limit=100`;
    const response: AxiosResponse<StockTwitsResponse> = yield call(axios.get, url);

    yield put(fetchTrendingMessagesSuccess(response.data.messages));
  } catch (error: any) {
    yield put(fetchTrendingMessagesFailure(error.message || 'Failed to fetch trending messages'));
  }
}

export function* stockSaga() {
  yield takeEvery(fetchTrendingMessagesStart.type, fetchTrendingMessages);
}
