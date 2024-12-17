import { module, test } from 'qunit';
import { setupRenderingTest } from 'frontend-lmb/tests/helpers';
import { render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';

module(
  'Integration | Component | generate-custom-field-button',
  function (hooks) {
    setupRenderingTest(hooks);

    test('it renders', async function (assert) {
      // Set any properties with this.set('myProperty', 'value');
      // Handle any actions with this.set('myAction', function(val) { ... });

      await render(hbs`<GenerateCustomFieldButton />`);

      assert.dom(this.element).hasText('');

      // Template block usage:
      await render(hbs`<GenerateCustomFieldButton>
  template block text
</GenerateCustomFieldButton>`);

      assert.dom(this.element).hasText('template block text');
    });
  }
);
