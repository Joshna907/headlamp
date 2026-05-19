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

/*
 * This module was taken from the k8dash project.
 */

import _ from 'lodash';

const RAM_TYPES = ['Bi', 'Ki', 'Mi', 'Gi', 'Ti', 'Pi', 'Ei'];
const UNITS = ['B', 'K', 'M', 'G', 'T', 'P', 'E'];

export const TO_GB = 1024 * 1024 * 1024;
export const TO_ONE_M_CPU = 1000000;
export const TO_ONE_CPU = 1000000000;

export function parseDiskSpace(value: string) {
  return parseUnitsOfBytes(value);
}

export function parseRam(value: string) {
  return parseUnitsOfBytes(value);
}

function parseUnitsOfBytes(value: string): number {
  if (!value) return 0;

  const trimmedValue = value.trim();

  const fractionalUnits: Record<string, number> = {
    m: 1e-3,
    u: 1e-6,
    n: 1e-9,
    p: 1e-12,
    f: 1e-15,
    a: 1e-18,
  };

  const groups =
    trimmedValue.match(/^([+-]?(?:\d+\.\d*|\.\d+|\d+))([BKMGTPEek])?(i)?([+-]?\d+)?$/) || [];
  if (groups.length === 0) {
    // Check for fractional units like 'm' (millibytes/units - unlikely but spec allows it for generic Quantity)
    const fractionalGroups = trimmedValue.match(/^([+-]?(?:\d+\.\d*|\.\d+|\d+))([munpfa])$/) || [];
    if (fractionalGroups.length > 0) {
      const num = parseFloat(fractionalGroups[1]);
      const unit = fractionalGroups[2];
      return num * fractionalUnits[unit];
    }
    return Number.NaN;
  }
  const number = parseFloat(groups[1]);

  // number ex. 1000
  if (groups[2] === undefined) {
    return number;
  }

  // number with exponent ex. 1e3 or 1E3
  // We prioritize scientific notation only if there is an exponent digit (groups[4])
  // OR if the unit is explicitly 'e' (lowercase).
  // If it's 'E' without an exponent, it's treated as Exabytes.
  const isScientific =
    (groups[2] === 'e' || groups[2] === 'E') && groups[4] !== undefined && groups[3] === undefined;

  if (isScientific) {
    const exponent = groups[4] ? parseInt(groups[4], 10) : 0;
    return number * 10 ** exponent;
  }

  const unit = groups[2];
  const unitIndex = _.indexOf(UNITS, unit);

  if (unitIndex === -1) {
    // Handle lowercase 'k' which is common but not in our uppercase UNITS list
    if (groups[2] === 'k') {
      return number * 1000;
    }
    return Number.NaN;
  }

  // Unit + i ex. 1Ki
  if (groups[3] !== undefined) {
    return number * 1024 ** unitIndex;
  }

  // Unit ex. 1K
  return number * 1000 ** unitIndex;
}

export function unparseRam(value: number) {
  let i = 0;
  while (value >= 1024 && i < RAM_TYPES.length - 1) {
    i++;
    value /= 1024; // eslint-disable-line no-param-reassign
  }

  return {
    value: _.round(value, 1),
    unit: RAM_TYPES[i],
  };
}

export function parseCpu(value: string) {
  if (!value) return 0;

  const trimmedValue = value.trim();
  const number = parseFloat(trimmedValue);
  if (trimmedValue.endsWith('n')) return number;
  if (trimmedValue.endsWith('u')) return number * 1000;
  if (trimmedValue.endsWith('m')) return number * 1000 * 1000;
  return number * 1000 * 1000 * 1000;
}

export function unparseCpu(value: string) {
  const result = parseFloat(value);

  return {
    value: _.round(result / 1000000, 2),
    unit: 'm',
  };
}

/**
 * Divides two Kubernetes resource quantities.
 * Useful for computing resource field references with divisors.
 * @param a - The dividend resource string (e.g., "1Gi", "500m")
 * @param b - The divisor resource string (e.g., "1Mi", "1")
 * @param resourceType - The type of resource ('cpu' or 'memory'). Defaults to 'memory'.
 * @returns The result of dividing a by b
 */
export function divideK8sResources(
  a: string,
  b: string,
  resourceType: 'cpu' | 'memory' = 'memory'
): number {
  if (resourceType === 'cpu') {
    return parseCpu(a) / parseCpu(b);
  }
  return parseUnitsOfBytes(a) / parseUnitsOfBytes(b);
}
