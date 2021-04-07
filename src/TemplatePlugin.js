import * as R from 'ramda';
import React from 'react';
import * as Flex from '@twilio/flex-ui';
import { FlexPlugin } from 'flex-plugin';

import MyPage from "./components/MyPage/MyPageContainer";
import SidebarMyButton from './components/SidebarMyButton/SidebarMyButton';
import reducers, {
  namespace, setCurrentTask, setServerlessUri, setSyncToken
} from './states';
import {getSyncToken} from './helpers';

const PLUGIN_NAME = 'TemplatePlugin';

const afterAcceptTask = R.curry((manager, payload) => {
  const {dispatch} = manager.store;
  const {task} = payload;
  const {attributes, priority, taskChannelUniqueName, taskSid, workerSid} = task;
  console.log(`${PLUGIN_NAME}.afterAcceptTask: channel = ${taskChannelUniqueName}`);
  const {topic} = attributes;
  // if the task meets the criteria of this plugin...
  if (taskChannelUniqueName === 'voice')
    dispatch( setCurrentTask(task) );
});

const afterCompleteTask = R.curry((manager, payload) => {
  const {dispatch} = manager.store;
  const {task} = payload;
  const {taskChannelUniqueName} = task;
  console.log(`${PLUGIN_NAME}.afterCompleteTask: task:`, task);
  if (taskChannelUniqueName === 'voice')
    dispatch( setCurrentTask(null) );
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
    console.log(`${PLUGIN_NAME}: initializing in Flex ${Flex.VERSION} instance`);
    const {store, serviceConfiguration} = manager;
    store.addReducer(namespace, reducers);
    const serverlessUri = process.env.REACT_APP_SERVERLESS_URI;
    console.log(`${PLUGIN_NAME}: serverless uri = ${serverlessUri}`);
    store.dispatch( setServerlessUri(serverlessUri) );

    // get the configuration
    const {
      chat_service_instance_sid, outbound_call_flows, runtime_domain,
      taskrouter_skills, taskrouter_workspace_sid, ui_attributes
    } = serviceConfiguration;
    const {colorTheme, language} = ui_attributes;
    console.log(`${PLUGIN_NAME}: configuration:`, serviceConfiguration);

    // get a Sync token for using Sync document/map/list objects
    getAndSetSyncToken(serverlessUri, manager);

    // register Action handlers for voice (single) tasks
    flex.Actions.addListener("afterAcceptTask", afterAcceptTask(manager));
    flex.Actions.addListener("afterCompleteTask", afterCompleteTask(manager));

    // add a side-navigation button for presenting a custom view
    flex.SideNav.Content.add(<SidebarMyButton key="my" />);

    // add a custom view
    flex.ViewCollection.Content.add(
      <Flex.View key="my-page" name="my-page">
        <MyPage serverlessUri={serverlessUri} />
      </Flex.View>
    );
  }
}
