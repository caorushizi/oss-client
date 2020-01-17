import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import './index.css';

ReactDOM.render(<App/>, document.getElementById('root'));

console.log('👋 This message is being logged by "renderer.js", included via webpack');
