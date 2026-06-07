/**
 * Simulation permissions — Issue #240 (E2.12).
 *
 * Verifies capability→permission mapping and visibility rules.
 */

import { strict as assert } from 'node:assert';
import {
  simulationPermissions,
  hasSimulationPermission,
  canAccessScenario,
} from '../../libs/auth/permissions.js';

const admin = { id: 1, administrable: true };
const accountant = { id: 2, accounting: true };
const viewer = { id: 3, fiscalBrowsing: true };
const nobody = { id: 4 };

describe('Simulation — E2.12 permissions', function () {
  describe('1) capability → permission mapping', function () {
    it('admin has all permissions', function () {
      const p = simulationPermissions(admin);
      for (const perm of ['simulation:view', 'simulation:create', 'simulation:lock', 'simulation:unlock', 'simulation:export']) {
        assert.ok(p.has(perm), `admin missing ${perm}`);
      }
    });
    it('accountant has view/create/lock/export but NOT unlock', function () {
      assert.ok(hasSimulationPermission(accountant, 'simulation:view'));
      assert.ok(hasSimulationPermission(accountant, 'simulation:create'));
      assert.ok(hasSimulationPermission(accountant, 'simulation:lock'));
      assert.ok(hasSimulationPermission(accountant, 'simulation:export'));
      assert.equal(hasSimulationPermission(accountant, 'simulation:unlock'), false);
    });
    it('viewer (fiscalBrowsing) has only view + export', function () {
      assert.ok(hasSimulationPermission(viewer, 'simulation:view'));
      assert.ok(hasSimulationPermission(viewer, 'simulation:export'));
      assert.equal(hasSimulationPermission(viewer, 'simulation:create'), false);
      assert.equal(hasSimulationPermission(viewer, 'simulation:lock'), false);
    });
    it('user with no capability has nothing', function () {
      assert.equal(simulationPermissions(nobody).size, 0);
      assert.equal(simulationPermissions(null).size, 0);
    });
  });

  describe('2) visibility', function () {
    const privateOwned = { id: 100, visibility: 'private', ownerId: accountant.id };
    const privateOther = { id: 101, visibility: 'private', ownerId: 999 };
    const shared = { id: 102, visibility: 'shared', ownerId: 999 };

    it('owner can access own private scenario', function () {
      assert.ok(canAccessScenario(accountant, privateOwned, 'simulation:view'));
    });
    it('non-owner cannot access another user private scenario', function () {
      assert.equal(canAccessScenario(accountant, privateOther, 'simulation:view'), false);
    });
    it('admin can access any private scenario', function () {
      assert.ok(canAccessScenario(admin, privateOther, 'simulation:view'));
    });
    it('any viewer can access a shared scenario', function () {
      assert.ok(canAccessScenario(viewer, shared, 'simulation:view'));
    });
    it('user without the permission is denied even on shared', function () {
      assert.equal(canAccessScenario(nobody, shared, 'simulation:view'), false);
    });
  });
});
