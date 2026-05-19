/*
 * Copyright 2025 The Kubernetes Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { configureStore } from '@reduxjs/toolkit';
import { describe, expect, it } from 'vitest';
import actionButtonsReducer, {
  addResourceActionProvider,
  ResourceActionProvider,
} from './actionButtonsSlice';

describe('actionButtonsSlice', () => {
  it('should handle initial state', () => {
    const store = configureStore({ reducer: { actionButtons: actionButtonsReducer } });
    expect(store.getState().actionButtons.resourceActionProviders).toEqual([]);
  });

  it('should register a resource action provider', () => {
    const store = configureStore({ reducer: { actionButtons: actionButtonsReducer } });
    const dummyProvider: ResourceActionProvider = () => [
      {
        id: 'test-action',
        label: 'Test Action',
        action: () => {},
      },
    ];

    store.dispatch(addResourceActionProvider(dummyProvider));
    const providers = store.getState().actionButtons.resourceActionProviders;
    expect(providers).toHaveLength(1);
    expect(providers[0]).toBe(dummyProvider);
  });
});
