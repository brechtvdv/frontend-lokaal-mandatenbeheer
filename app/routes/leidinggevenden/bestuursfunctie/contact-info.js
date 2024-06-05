import Route from '@ember/routing/route';

import { service } from '@ember/service';

import { getFormFrom } from 'frontend-lmb/utils/get-form';
import { CONTACTINFO_FORM_ID } from 'frontend-lmb/utils/well-known-ids';

export default class LeidinggevendenBestuursfunctiesBestuursfunctieContactInfoRoute extends Route {
  @service store;

  async model() {
    const bestuurseenheid = this.modelFor('leidinggevenden');
    const bestuursfunctie = this.modelFor('leidinggevenden.bestuursfunctie');

    let info = await bestuursfunctie.contactinfo;
    if (!info) {
      info = await this.store.createRecord('contact-punt');
      await info.save();

      bestuursfunctie.set('contactinfo', info);
      await bestuursfunctie.save();
    }

    const form = await getFormFrom(this.store, CONTACTINFO_FORM_ID);

    return {
      bestuurseenheid,
      bestuursfunctie,
      info,
      form,
    };
  }
}
