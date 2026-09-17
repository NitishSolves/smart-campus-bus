/**
 * Location source registry.
 *
 * Every coordinate written to the system declares where it came from. The demo
 * simulator only advances trips whose latest location came from an "automatic"
 * source; trips reporting from a real device are never overwritten. Future GPS
 * hardware can register a provider here and call
 * `tracking.recordLocation({ ..., source: '<provider>' })` without changing the
 * rest of the application.
 */

const PROVIDERS = new Map();

function registerProvider(name, { automatic = false, label = name } = {}) {
  if (!name) throw new Error('A provider name is required');
  PROVIDERS.set(name, { name, automatic: Boolean(automatic), label });
  return PROVIDERS.get(name);
}

function getProvider(name) {
  return PROVIDERS.get(name) || null;
}

function isAutomaticSource(name) {
  return Boolean(getProvider(name)?.automatic);
}

function listProviders() {
  return [...PROVIDERS.values()];
}

registerProvider('simulation', { automatic: true, label: 'Simulated' });
registerProvider('device', { automatic: false, label: 'Device GPS' });
registerProvider('manual', { automatic: false, label: 'Manual' });

module.exports = {
  registerProvider,
  getProvider,
  isAutomaticSource,
  listProviders,
};
