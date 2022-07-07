import React from 'react';
import ReactDOM from 'react-dom';
import 'bootstrap/dist/css/bootstrap.css';
import App from './App';
import * as serviceWorker from './serviceWorker';

const root = document.getElementById("root");

ReactDOM.render(<App />, root);

serviceWorker.unregister();
