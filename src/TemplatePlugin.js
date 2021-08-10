import * as R from 'ramda';
import React from 'react';
import * as Flex from '@twilio/flex-ui';
import { FlexPlugin } from 'flex-plugin';
import { SyncClient } from "twilio-sync";

import MyPage from "./components/MyPage/MyPageContainer";
import SidebarMyButton from './components/SidebarMyButton/SidebarMyButton';
import reducers, {
  namespace, setCurrentTask, setServerlessUri, setSyncClient
} from './states';
import {mkGetSyncToken, mkUpdateTokenInSyncClient} from './helpers';

const PLUGIN_NAME = 'TemplatePlugin';

const onReservationCreated = (reservation) => {
  console.log(`${PLUGIN_NAME}.onReservationCreated: reservation = ${reservation}`);
  const task = reservation.task;
  console.log(`${PLUGIN_NAME}: task.attributes`, task.attributes)
};

// Note the use of Ramda's curry function for pre-applying 'manager' to the
//   callback, which will only pass us the 'payload' argument;
//   Another option is to import Manager and call Manager.getInstance()
const afterAcceptTask = R.curry((manager, payload) => {
  const {dispatch} = manager.store;
  const {task} = payload;
  const {attributes, priority, taskChannelUniqueName} = task;
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

const getAndSaveSyncClient = async (getSyncToken, manager) => {
  const syncTokenResponse = await getSyncToken();
  const syncClient = new SyncClient(syncTokenResponse.token);
  syncClient.on(
    'tokenAboutToExpire',
    mkUpdateTokenInSyncClient(getSyncToken, syncClient, 'Sync token expiring')
  );
  const {dispatch} = manager.store;
  dispatch( setSyncClient(syncClient) );
  return syncClient;
};

export default class TemplatePlugin extends FlexPlugin {
  constructor() {
    super(PLUGIN_NAME);
  }

  async init(flex, manager) {
    console.log(`${PLUGIN_NAME}: initializing in Flex ${Flex.VERSION} instance`);
    const {store, serviceConfiguration} = manager;
    store.addReducer(namespace, reducers);
    const serverlessUri = process.env.REACT_APP_SERVERLESS_URI;
    console.log(`${PLUGIN_NAME}: serverless uri = ${serverlessUri}`);
    store.dispatch( setServerlessUri(serverlessUri) );

    // get the Flex configuration
    const {
      chat_service_instance_sid, outbound_call_flows, runtime_domain,
      taskrouter_skills, taskrouter_workspace_sid, ui_attributes
    } = serviceConfiguration;
    const {colorTheme, language} = ui_attributes;
    console.log(`${PLUGIN_NAME}: configuration:`, serviceConfiguration);

    // if Flex is to be iFramed into another app, hide Panel2
    //flex.AgentDesktopView.defaultProps.showPanel2 = false;

    // configure simple screenpop in panel2
    flex.CRMContainer.defaultProps.uriCallback = (task) => {
      const baseUrl = `https://app.hubspot.com/contacts/${process.env.REACT_APP_HUB_ORG}/contact`
      return task 
        ? `${baseUrl}/${task.attributes.contactId}/`
        : `${baseUrl}/contacts/list/view/all`;
    }

    // not sure when these are needed???
    //flex.MainContainer.defaultProps.keepSideNavOpen = true;
    //flex.RootContainer.Content.remove("project-switcher");

    // register a callback for TR Worker client event
    manager.workerClient.on("reservationCreated", onReservationCreated);

    // register Action handlers for voice (single) tasks
    // Note: we're not calling the afterAcceptTask function, just pre-applying
    //   the manager; this returns a curried callback function
    flex.Actions.addListener("afterAcceptTask", afterAcceptTask(manager));
    flex.Actions.addListener("afterCompleteTask", afterCompleteTask(manager));

    // add a side-navigation button for presenting a custom view
    flex.SideNav.Content.add(<SidebarMyButton key="my-button" />);

    // add a custom view
    // Note: MyPage does not use serverlessUri but that's how you can pass it
    //   to a component that needs it to call a Serverless function
    flex.ViewCollection.Content.add(
      <Flex.View key="my-page" name="my-page">
        <MyPage serverlessUri={serverlessUri} />
      </Flex.View>
    );

    // get a Sync client for using Twilio Sync objects
    // NOTE: moving this code above the component additions above caused those
    //   components to not render???
    const mintSyncTokenUrl = `${serverlessUri}/get-sync-token`;
    const flexState = store.getState().flex;
    const worker = flexState.worker.source;
    const getSyncToken = mkGetSyncToken(mintSyncTokenUrl, manager, worker.sid);
    const syncClient = await getAndSaveSyncClient(getSyncToken, manager);

    // add listener to refresh Sync token when Flex token is updated
    manager.events.addListener(
      "tokenUpdated",
      mkUpdateTokenInSyncClient(getSyncToken, syncClient, 'Flex token updated')
    );
  }
}
