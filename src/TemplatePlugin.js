import * as R from 'ramda';
import React from 'react';
import { VERSION } from '@twilio/flex-ui';
import { FlexPlugin } from 'flex-plugin';

import reducers, {
  namespace, setCurrentTask, setServerlessUri, setSyncToken
} from './states';
import {getSyncToken} from './helpers';

const PLUGIN_NAME = 'TemplatePlugin';

const afterAcceptTask = R.curry((manager, payload) => {
  const {dispatch} = manager.store;
  const {task} = payload;
  dispatch( setCurrentTask(task) );
  const {priority, taskChannelUniqueName} = task;
  console.log(`${PLUGIN_NAME}: channel = ${taskChannelUniqueName}`);
  const {topic} = task.attributes;
});

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
    console.log(`${PLUGIN_NAME}: initializing in Flex ${VERSION} instance`);
    const {store, serviceConfiguration} = manager;
    store.addReducer(namespace, reducers);
    const serverlessUri = process.env.REACT_APP_SERVERLESS_URI;
    console.log(`${PLUGIN_NAME}: serverless uri = ${serverlessUri}`);
    store.dispatch( setServerlessUri(serverlessUri) );
    const {
      chat_service_instance_sid, outbound_call_flows, runtime_domain,
      taskrouter_skills, taskrouter_workspace_sid, ui_attributes
    } = serviceConfiguration;
    const {colorTheme, language} = ui_attributes;
    console.log(`${PLUGIN_NAME}: configuration:`, serviceConfiguration);
    getAndSetSyncToken(serverlessUri, manager);
    flex.Actions.addListener("afterAcceptTask", afterAcceptTask(manager));
  }
}
