import Route from '@ember/routing/route';

import { service } from '@ember/service';

import { BESTUURSEENHEID_CLASSIFICATIECODE_OCMW } from 'frontend-lmb/utils/well-known-uris';

export default class LeidinggevendenBestuursfunctieRoute extends Route {
  @service currentSession;
  @service router;
  @service store;

  async afterModel() {
    const bestuurseenheidClassificatie =
      this.currentSession.groupClassification;
    if (
      bestuurseenheidClassificatie.uri ===
      BESTUURSEENHEID_CLASSIFICATIECODE_OCMW
    ) {
      this.router.transitionTo('leidinggevenden.bestuursfuncties.index');
    }
  }

  model(params) {
    return this.store.findRecord('bestuursfunctie', params.bestuursfunctie_id);
  }
}
