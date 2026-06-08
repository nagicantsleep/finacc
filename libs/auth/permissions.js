/**
 * Simulation permissions — Issue #240 (E2.12).
 *
 * The user model exposes capability booleans (accounting, fiscalBrowsing,
 * administrable, ...) rather than named roles, so simulation permissions are
 * derived from those capabilities (hard-coded mapping per initiative §2.12 —
 * no RBAC schema in this phase).
 *
 * Permissions:
 *   simulation:view    — read scenarios/entries/reports
 *   simulation:create  — create / edit / clone scenarios + entries
 *   simulation:lock    — lock / archive
 *   simulation:unlock  — unlock (admin only)
 *   simulation:export    — Excel export
 *   simulation:regenerate — regenerate generated entries from assumptions
 *
 * Capability → permission mapping (a user is "accountant-like" if accounting,
 * "viewer-like" if fiscalBrowsing, "admin" if administrable):
 *   administrable  → all
 *   accounting     → view, create, lock, export, regenerate  (not unlock)
 *   fiscalBrowsing → view, export
 */

const PERMS = ['simulation:view', 'simulation:create', 'simulation:lock', 'simulation:unlock', 'simulation:export', 'simulation:regenerate'];

export function simulationPermissions(user) {
  const set = new Set();
  if (!user) return set;
  if (user.administrable) {
    for (const p of PERMS) set.add(p);
    return set;
  }
  if (user.accounting) {
    set.add('simulation:view');
    set.add('simulation:create');
    set.add('simulation:lock');
    set.add('simulation:export');
    set.add('simulation:regenerate');
  }
  if (user.fiscalBrowsing) {
    set.add('simulation:view');
    set.add('simulation:export');
  }
  return set;
}

export function hasSimulationPermission(user, perm) {
  return simulationPermissions(user).has(perm);
}

/**
 * Visibility check for a single scenario.
 *   private → owner or admin only
 *   shared  → any user with simulation:view
 */
export function canAccessScenario(user, scenario, perm = 'simulation:view') {
  if (!user || !scenario) return false;
  if (!hasSimulationPermission(user, perm)) return false;
  if (user.administrable) return true;
  if (scenario.visibility === 'private') {
    return scenario.ownerId === user.id;
  }
  // shared
  return true;
}

/**
 * Express middleware factory: require a simulation permission.
 * Use after is_authenticated + requireTenant.
 */
export function requireSimulationPermission(perm) {
  return (req, res, next) => {
    const user = req.session && req.session.user ? req.session.user : null;
    if (!hasSimulationPermission(user, perm)) {
      return res.status(403).json({
        result: 'NG',
        code: 'FORBIDDEN',
        message: `requires ${perm}`,
      });
    }
    next();
  };
}

export { PERMS };
