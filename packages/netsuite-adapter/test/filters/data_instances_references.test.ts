/*
*                      Copyright 2021 Salto Labs Ltd.
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
import { BuiltinTypes, CORE_ANNOTATIONS, ElemID, InstanceElement, ListType, ObjectType, ReferenceExpression } from '@salto-io/adapter-api'
import { buildElementsSourceFromElements } from '@salto-io/adapter-utils'
import filterCreator from '../../src/filters/data_instances_references'
import NetsuiteClient from '../../src/client/client'
import { NETSUITE } from '../../src/constants'

describe('data_instances_references', () => {
  const firstType = new ObjectType({
    elemID: new ElemID(NETSUITE, 'firstType'),
    fields: {
      internalId: {
        refType: BuiltinTypes.STRING,
        annotations: { [CORE_ANNOTATIONS.HIDDEN_VALUE]: true },
      },
    },
    annotations: { source: 'soap' },
  })
  const secondType = new ObjectType({
    elemID: new ElemID(NETSUITE, 'secondType'),
    fields: {
      field: { refType: firstType },
      recordRefList: { refType: new ListType(firstType) },
    },
    annotations: { source: 'soap' },
  })
  it('should replace with reference', async () => {
    const instance = new InstanceElement(
      'instance',
      secondType,
      { field: { internalId: '1' } }
    )

    const referencedInstance = new InstanceElement(
      'referencedInstance',
      firstType,
      { internalId: '1' }
    )

    const filterOpts = {
      elements: [instance, referencedInstance],
      client: {} as NetsuiteClient,
      elementsSourceIndex: {
        getIndexes: () => Promise.resolve({
          serviceIdsIndex: {},
          internalIdsIndex: {},
          customFieldsIndex: {},
        }),
      },
      elementsSource: buildElementsSourceFromElements([]),
      isPartial: false,
      dataTypeNames: new Set<string>(),
    }
    await filterCreator(filterOpts).onFetch?.([instance, referencedInstance])
    expect((instance.value.field as ReferenceExpression).elemID.getFullName())
      .toBe(referencedInstance.elemID.getFullName())
  })

  it('should change nothing if reference was not found', async () => {
    const instance = new InstanceElement(
      'instance',
      secondType,
      { field: { internalId: '1' } }
    )

    const filterOpts = {
      elements: [instance],
      client: {} as NetsuiteClient,
      elementsSourceIndex: {
        getIndexes: () => Promise.resolve({
          serviceIdsIndex: {},
          internalIdsIndex: {},
          customFieldsIndex: {},
        }),
      },
      elementsSource: buildElementsSourceFromElements([]),
      isPartial: false,
      dataTypeNames: new Set<string>(),
    }
    await filterCreator(filterOpts).onFetch?.([instance])
    expect(instance.value.field.internalId).toBe('1')
  })

  it('should use the elementsSource if partial', async () => {
    const instance = new InstanceElement(
      'instance',
      secondType,
      { field: { internalId: '1' } }
    )

    const referencedInstance = new InstanceElement(
      'referencedInstance',
      firstType,
      { internalId: '1' }
    )

    const fetchOpts = {
      client: {} as NetsuiteClient,
      elementsSourceIndex: {
        getIndexes: () => Promise.resolve({
          serviceIdsIndex: {},
          internalIdsIndex: {
            'firstType-1': { elemID: referencedInstance.elemID },
          },
          customFieldsIndex: {},
        }),
      },
      elementsSource: buildElementsSourceFromElements([]),
      isPartial: true,
      dataTypeNames: new Set<string>(),
    }
    await filterCreator(fetchOpts).onFetch?.([instance])
    expect((instance.value.field as ReferenceExpression).elemID.getFullName())
      .toBe(referencedInstance.elemID.getFullName())
  })

  it('should replace recordRefList references', async () => {
    const instance = new InstanceElement(
      'instance',
      secondType,
      { recordRefList: { recordRef: [{ internalId: '1' }] } }
    )

    const referencedInstance = new InstanceElement(
      'referencedInstance',
      firstType,
      { internalId: '1' }
    )

    const fetchOpts = {
      client: {} as NetsuiteClient,
      elementsSourceIndex: {
        getIndexes: () => Promise.resolve({
          serviceIdsIndex: {},
          internalIdsIndex: {},
          customFieldsIndex: {},
        }),
      },
      elementsSource: buildElementsSourceFromElements([]),
      isPartial: false,
      dataTypeNames: new Set<string>(),
    }
    await filterCreator(fetchOpts).onFetch?.([instance, referencedInstance])
    expect((instance.value.recordRefList[0] as ReferenceExpression).elemID.getFullName())
      .toBe(referencedInstance.elemID.getFullName())
  })
})