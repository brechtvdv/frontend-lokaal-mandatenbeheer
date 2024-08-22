import InputFieldComponent from '@lblod/ember-submission-form-fields/components/rdf-input-fields/input-field';

import { guidFor } from '@ember/object/internals';
import { tracked } from '@glimmer/tracking';
import { service } from '@ember/service';
import { action } from '@ember/object';

import { NamedNode } from 'rdflib';
import { triplesForPath } from '@lblod/submission-form-helpers';
import { replaceSingleFormValue } from 'frontend-lmb/utils/replaceSingleFormValue';
import { loadBestuursorgaanUrisFromContext } from 'frontend-lmb/utils/form-context/bestuursorgaan-meta-ttl';
import { MANDAAT } from 'frontend-lmb/rdf/namespaces';

export default class MandatarisMandaatSelector extends InputFieldComponent {
  inputId = 'input-' + guidFor(this);

  @service store;
  @service multiUriFetcher;

  @tracked mandaat = null;
  @tracked initialized = false;
  @tracked bestuursorganen = [];
  @tracked person;

  constructor() {
    super(...arguments);
    this.load();
  }

  async load() {
    await Promise.all([
      this.findPersonOnInit(),
      this.loadProvidedValue(),
      this.loadBestuursorganen(),
    ]);
    this.initialized = true;
  }

  async loadBestuursorganen() {
    const bestuursorgaanUris = loadBestuursorgaanUrisFromContext(
      this.storeOptions
    );

    if (!bestuursorgaanUris) {
      return;
    }

    this.bestuursorganen = await this.multiUriFetcher.fetchUris(
      'bestuursorgaan',
      bestuursorgaanUris
    );
  }

  async loadProvidedValue() {
    const mandaatTriples = triplesForPath(this.storeOptions, false).values;
    if (!mandaatTriples.length) {
      return;
    }
    const mandaatUri = mandaatTriples[0].value;

    const matches = await this.store.query('mandaat', {
      'filter[:uri:]': mandaatUri,
    });
    this.mandaat = matches.at(0);
  }

  @action
  async updateMandaat(mandate) {
    const uri = mandate?.uri;

    replaceSingleFormValue(this.storeOptions, uri ? new NamedNode(uri) : null);
    this.hasBeenFocused = true;
    super.updateValidations();
  }

  async findPersonOnInit() {
    const possiblePersonNode = this.storeOptions.store.any(
      this.storeOptions.sourceNode,
      MANDAAT('isBestuurlijkeAliasVan'),
      undefined,
      this.storeOptions.sourceGraph
    );
    if (possiblePersonNode) {
      const personMatches = await this.store.query('persoon', {
        'filter[:uri:]': possiblePersonNode.value,
      });
      if (personMatches.length === 0) {
        this.person = null;
      } else {
        this.person = personMatches.at(0);
      }
    }
    console.log(`found person in triplestore`, this.person);
  }
}
