import {callApiFormEncoded} from 'jlafer-flex-util';
import * as R from 'ramda';
const SyncClient = require('twilio-sync');

export const getSyncToken = (url, manager, identity) => {
  const flexState = manager.store.getState().flex;
  const token = flexState.session.ssoTokenPayload.token;
  const data = {Identity: identity, Token: token};
  return callApiFormEncoded(url, 'post', data);
};

export const getSyncDoc = R.curry((docCallback, docName, token, options) => {
  const clientOptions = {
    logLevel: "info"
  };
  const client = new SyncClient(token, clientOptions);

  client.on("connectionStateChanged", state => {
    console.log('getSyncClientAndDoc.connectionState: ', {state});
  });

  const docOptions = {id: docName, ...options};
  return client.document(docOptions).then(doc => {
    console.log('getSyncClientAndDoc: opened doc:', {sid: doc.sid});
    doc.on("updated", docCallback);
    return doc;
  });
});
