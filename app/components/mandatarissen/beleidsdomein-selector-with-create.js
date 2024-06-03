import Component from '@glimmer/component';

import { service } from '@ember/service';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';

import { task, timeout } from 'ember-concurrency';
import { SEARCH_TIMEOUT } from 'frontend-lmb/utils/constants';
import { BELEIDSDOMEIN_CODES_CONCEPT_SCHEME } from 'frontend-lmb/utils/well-known-uris';

export default class MandatenbeheerBeleidsdomeinSelectorWithCreateComponent extends Component {
  @service store;

  @tracked selected = [];
  @tracked options = [];
  conceptScheme = BELEIDSDOMEIN_CODES_CONCEPT_SCHEME;

  constructor() {
    super(...arguments);
    this.selected = this.args.beleidsdomeinen || [];
    this.load();
  }

  async load() {
    this.options = await this.fetchOptions();
  }

  async fetchOptions(searchData) {
    let queryParams = {
      sort: 'label',
    };
    if (searchData) {
      queryParams['filter[label]'] = searchData;
    }
    return await this.store.query('beleidsdomein-code', queryParams);
  }

  search = task({ restartable: true }, async (searchData) => {
    await timeout(SEARCH_TIMEOUT);
    let searchResults = await this.fetchOptions(searchData);
    this.options = searchResults;
    return searchResults;
  });

  @action
  select(beleidsdomeinen) {
    this.selected.setObjects(beleidsdomeinen);
    this.args.onSelect(this.selected);
  }

  @action
  add(beleidsdomein) {
    let oldSelection = [...this.selected];
    oldSelection.push(beleidsdomein);
    this.select(oldSelection);
  }
}
