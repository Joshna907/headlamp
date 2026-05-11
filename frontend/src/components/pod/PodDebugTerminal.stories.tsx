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

import { Meta, StoryFn } from '@storybook/react';
import { http, HttpResponse } from 'msw';
import React from 'react';
import Pod from '../../lib/k8s/pod';
import { TestContext } from '../../test';
import { PodDebugTerminal } from './PodDebugTerminal';

const mockPod = new Pod({
  kind: 'Pod',
  apiVersion: 'v1',
  metadata: {
    name: 'mock-pod',
    namespace: 'default',
    resourceVersion: '1',
    uid: '1',
    creationTimestamp: '2025-01-01T00:00:00Z',
  },
  spec: {
    containers: [
      {
        name: 'mock-container',
        image: 'busybox',
        imagePullPolicy: 'IfNotPresent',
      },
    ],
    nodeName: 'mock-node',
  },
  status: {
    phase: 'Running',
    conditions: [],
    containerStatuses: [
      {
        name: 'mock-container',
        image: 'busybox',
        ready: true,
        restartCount: 0,
        state: { running: { startedAt: '2025-01-01T00:00:00Z' } },
        lastState: {},
        imageID: 'busybox-id',
        containerID: 'containerd://id',
      },
    ],
    startTime: '2025-01-01T00:00:00Z',
  },
});

export default {
  title: 'pod/PodDebugTerminal',
  component: PodDebugTerminal,
  decorators: [
    Story => {
      // Initialize cluster settings with debug enabled
      localStorage.setItem(
        'cluster_settings.default',
        JSON.stringify({
          podDebugTerminal: {
            isEnabled: true,
          },
        })
      );
      // Set URL immediately, before any component renders
      const originalPath = window.location.pathname;
      const mockPath = '/c/default/namespace/default/name/mock-pod';
      window.history.replaceState({}, '', mockPath);

      // Wrapper component to handle cleanup
      const ClusterMockWrapper = () => {
        React.useEffect(() => {
          // Cleanup: restore original path when component unmounts
          return () => {
            window.history.replaceState({}, '', originalPath);
          };
        }, []);

        return (
          <TestContext>
            <Story />
          </TestContext>
        );
      };

      return <ClusterMockWrapper />;
    },
  ],
  parameters: {
    msw: {
      handlers: {
        story: [
          // Mock authorization checks
          http.post('**/apis/authorization.k8s.io/v1/selfsubjectaccessreviews', () =>
            HttpResponse.json({ status: { allowed: true, reason: '', code: 200 } })
          ),
          // Mock the PATCH request to create ephemeral container
          http.patch('**/api/v1/namespaces/default/pods/mock-pod/ephemeralcontainers', async () => {
            return HttpResponse.json({
              ...mockPod.jsonData,
              spec: {
                ...mockPod.jsonData.spec,
                ephemeralContainers: [],
              },
              status: {
                ...mockPod.jsonData.status,
                ephemeralContainerStatuses: [],
              },
            });
          }),
          // Mock the GET request to poll pod status
          http.get('**/api/v1/namespaces/default/pods/mock-pod', () => {
            return HttpResponse.json(mockPod.jsonData);
          }),
          // Mock the GET request for watching the pod status
          http.get('**/api/v1/namespaces/default/pods', () => {
            return HttpResponse.json({
              kind: 'PodList',
              items: [mockPod.jsonData],
            });
          }),
        ],
      },
    },
  },
} as Meta<typeof PodDebugTerminal>;

const Template: StoryFn<React.ComponentProps<typeof PodDebugTerminal>> = args => {
  const { item = mockPod, onClose = () => {}, ...rest } = args;
  return <PodDebugTerminal onClose={onClose} item={item} {...rest} />;
};

export const Default = Template.bind({});
Default.args = {};
