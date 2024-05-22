import { module, test } from 'qunit';
import { setupTest } from 'frontend-lmb/tests/helpers';

module('Unit | Route | mandatarissen/upload', function (hooks) {
  setupTest(hooks);

  test('it exists', function (assert) {
    let route = this.owner.lookup('route:mandatarissen/upload');
    assert.ok(route);
  });
});
