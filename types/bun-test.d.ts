/*
 * Copyright (c) 2026 Nexttylabs Team
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

declare module "bun:test" {
  export const describe: (...args: unknown[]) => unknown;
  export const it: (...args: unknown[]) => unknown;
  export const test: (...args: unknown[]) => unknown;
  export const expect: (...args: unknown[]) => unknown;
  export const beforeAll: (...args: unknown[]) => unknown;
  export const beforeEach: (...args: unknown[]) => unknown;
  export const afterAll: (...args: unknown[]) => unknown;
  export const afterEach: (...args: unknown[]) => unknown;
  export const mock: {
    (...args: unknown[]): unknown;
    module: (...args: unknown[]) => unknown;
  };
}
