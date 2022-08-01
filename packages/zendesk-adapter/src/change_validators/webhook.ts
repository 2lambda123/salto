/*
*                      Copyright 2022 Salto Labs Ltd.
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with
* the License.  You may obtain a copy of the License at
*
*     http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/
import { ChangeError, ChangeValidator, ElemID, getChangeData,
  isAdditionChange, isAdditionOrModificationChange, isInstanceChange } from '@salto-io/adapter-api'
import ZendeskClient from '../client/client'
import { WEBHOOK_TYPE_NAME } from '../filters/webhook'

const WEBHOOKS_SERVICE_URL = 'admin/apps-integrations/webhooks/webhooks'

export const createChangeError = (instanceElemId: ElemID, baseUrl: string): ChangeError => ({
  elemID: instanceElemId,
  severity: 'Info',
  message: 'Webhook authentication change detected',
  detailedMessage: '',
  deployActions: {
    preAction: {
      title: 'Current authentication data for a webhook will be overridden',
      description: `Current authentication data for the webhook ${instanceElemId.name} will be overridden`,
      subActions: [],
    },
    postAction: {
      title: 'Change webhook authentication data',
      description: `Please change the authentication data for the webhook ${instanceElemId.name} in the service`,
      subActions: [
        `Go to zendesk Webhooks panel ${baseUrl}${WEBHOOKS_SERVICE_URL}`,
        'Click on the modified webhook',
        'Click on Actions > Edit',
        'Enter the authentication data',
        'Click "Update"',
      ],
    },
  },
})

export const webhookAuthDataValidator: (client: ZendeskClient) =>
  ChangeValidator = client => async changes => (
    changes
      .filter(isAdditionOrModificationChange)
      .filter(isInstanceChange)
      .filter(change => getChangeData(change).elemID.typeName === WEBHOOK_TYPE_NAME)
      .filter(change => ['bearer_token', 'basic_auth'].includes(getChangeData(change).value.authentication?.type))
      .filter(change =>
        isAdditionChange(change)
        || (change.data.before.value.authentication?.type
          !== change.data.after.value.authentication?.type))
      .map(getChangeData)
      .flatMap(instance => ([createChangeError(instance.elemID, client.getUrl().href)]))
  )