import React from 'react';
import { VERSION } from '@twilio/flex-ui';
import { FlexPlugin } from 'flex-plugin';

import reducers, {
  namespace, setCurrentTask, setServerlessUri, setSyncToken
} from './states';
import {getSyncToken} from './helpers';

const PLUGIN_NAME = 'TemplatePlugin';

const getAndSetSyncToken = (serverlessUri, manager) => {
  const {store} = manager;
  const flexState = store.getState().flex;
  const worker = flexState.worker.source;
  const syncTokenFunctionUrl = `${serverlessUri}/get-sync-token`;
  getSyncToken(syncTokenFunctionUrl, manager, worker.sid)
  .then(tokenResponse => store.dispatch( setSyncToken(tokenResponse.token) ));
};

export default class TemplatePlugin extends FlexPlugin {
  constructor() {
    super(PLUGIN_NAME);
  }

  init(flex, manager) {
    console.log(`${PLUGIN_NAME}: initializing...`);
    const {store} = manager;
    store.addReducer(namespace, reducers);
    const serverlessUri = process.env.REACT_APP_SERVERLESS_URI;
    console.log(`${PLUGIN_NAME}: serverless uri = ${serverlessUri}`);
    store.dispatch( setServerlessUri(serverlessUri) );
    getAndSetSyncToken(serverlessUri, manager);
  }

  registerReducers(manager) {
    if (!manager.store.addReducer) {
      // eslint: disable-next-line
      console.error(`You need FlexUI > 1.9.0 to use built-in redux; you are currently on ${VERSION}`);
      return;
    }
    manager.store.addReducer(namespace, reducers);
  }
}
