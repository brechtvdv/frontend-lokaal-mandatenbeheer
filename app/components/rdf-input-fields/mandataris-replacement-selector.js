import InputFieldComponent from '@lblod/ember-submission-form-fields/components/rdf-input-fields/input-field';

import { action } from '@ember/object';
import { guidFor } from '@ember/object/internals';
import { service } from '@ember/service';
import { tracked } from '@glimmer/tracking';

import {
  triplesForPath,
  updateSimpleFormValue,
} from '@lblod/submission-form-helpers';
import { task, timeout } from 'ember-concurrency';
import { MANDAAT, ORG } from 'frontend-lmb/rdf/namespaces';
import { SEARCH_TIMEOUT } from 'frontend-lmb/utils/constants';
import {
  MANDATARIS_TITELVOEREND_STATE,
  MANDATARIS_VERHINDERD_STATE,
} from 'frontend-lmb/utils/well-known-uris';
import { NamedNode } from 'rdflib';

export default class MandatarisReplacementSelector extends InputFieldComponent {
  inputId = 'input-' + guidFor(this);

  @service store;
  @service multiUriFetcher;

  @tracked replacements = null;
  @tracked initialized = false;
  @tracked mandaat = null;
  @tracked shouldRender = false;

  @tracked editing = false;

  constructor() {
    super(...arguments);
    this.load();
    this.registerObserver();
  }

  async load() {
    await Promise.all([this.loadProvidedValue(), this.loadMandaat()]);
    this.initialized = true;
  }

  registerObserver() {
    const onFormUpdate = () => {
      if (this.isDestroyed) {
        return;
      }

      this.loadMandaat();
      this.checkIfShouldRender();
    };
    this.storeOptions.store.registerObserver(onFormUpdate);
    onFormUpdate();
  }

  checkIfShouldRender() {
    this.shouldRender =
      this.storeOptions.store.any(
        this.storeOptions.sourceNode,
        MANDAAT('status'),
        new NamedNode(MANDATARIS_VERHINDERD_STATE),
        this.storeOptions.sourceGraph
      ) ||
      this.storeOptions.store.any(
        this.storeOptions.sourceNode,
        MANDAAT('status'),
        new NamedNode(MANDATARIS_TITELVOEREND_STATE),
        this.storeOptions.sourceGraph
      );
    if (!this.shouldRender && this.replacements?.length > 0) {
      // without timeout, the form ttl doesn't update immediately
      setTimeout(() => this.selectReplacement([]), 100);
    }
  }

  get title() {
    return this.args.field?.label || 'Tijdelijk vervangen door';
  }

  // todo need to watch store and refresh every time
  async loadMandaat() {
    const forkingStore = this.storeOptions.store;
    const mandaatUri = forkingStore.any(
      this.storeOptions.sourceNode,
      ORG('holds'),
      null,
      this.storeOptions.sourceGraph
    )?.value;

    if (!mandaatUri || this.mandaat?.uri === mandaatUri) {
      return;
    }

    this.mandaat = (
      await this.store.query('mandaat', {
        'filter[:uri:]': mandaatUri,
      })
    )[0];
  }

  async loadProvidedValue() {
    const replacementTriples = triplesForPath(this.storeOptions, false).values;
    if (!replacementTriples.length) {
      return;
    }
    const replacementUris = replacementTriples.map((triple) => {
      return triple.value;
    });

    const matches = await this.multiUriFetcher.fetchUris(
      'mandataris',
      replacementUris
    );
    this.replacements = matches;
  }

  search = task({ keepLatest: true }, async (searchData) => {
    await timeout(SEARCH_TIMEOUT);
    return this.store.query('mandataris', {
      sort: 'is-bestuurlijke-alias-van.achternaam',
      include: 'is-bestuurlijke-alias-van',
      filter: {
        'is-bestuurlijke-alias-van': searchData,
        bekleedt: {
          id: this.mandaat.id,
        },
      },
    });
  });

  @action
  selectReplacement(mandatarises) {
    if (this.isDestroyed || this.isDestroying) {
      return;
    }
    this.replacements = mandatarises;

    // Retrieve options in store
    const matches = triplesForPath(this.storeOptions, true).values;

    // Cleanup old value(s) in the store
    matches
      .filter((m) => !mandatarises.find((opt) => m.value == opt.uri))
      .forEach((m) => updateSimpleFormValue(this.storeOptions, undefined, m));

    // Insert new value in the store
    mandatarises.forEach((mandataris) =>
      updateSimpleFormValue(this.storeOptions, new NamedNode(mandataris.uri))
    );

    this.hasBeenFocused = true;
    super.updateValidations();
  }
}
