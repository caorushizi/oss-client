import React from 'react';
import ReactDOM from 'react-dom';
import {Provider} from 'react-redux';
import {applyMiddleware, compose, createStore} from 'redux';
import {composeWithDevTools} from 'redux-devtools-extension';
import thunk from 'redux-thunk';
import App from './App';
import './index.scss';
import {rootReducer} from './store';

// todo: 开发环境
const store = createStore(rootReducer,
  compose(
    applyMiddleware(thunk),
    composeWithDevTools()
  ),
);

const rooElement = document.getElementById('root');
ReactDOM.render(
  <Provider store={store}>
    <App/>
  </Provider>,
  rooElement
);

/**
 * TODO LIST
 * 1、在渲染进程中不使用 node；
 * 2、熟悉脚手架工具；
 * 3、尝试使用 gulp；
 * 4、mobx
 * 5、Immutable.js
 */
