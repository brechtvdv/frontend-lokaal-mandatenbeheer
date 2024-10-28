import Route from '@ember/routing/route';

import { service } from '@ember/service';

import { getFormFrom } from 'frontend-lmb/utils/get-form';
import {
  MANDATARIS_EDIT_FORM_ID,
  MANDATARIS_EXTRA_INFO_FORM_ID,
} from 'frontend-lmb/utils/well-known-ids';
import RSVP from 'rsvp';

export default class MandatarissenPersoonMandatarisRoute extends Route {
  @service currentSession;
  @service store;

  async model(params) {
    const bestuurseenheid = this.currentSession.group;
    const parentModel = await this.modelFor('mandatarissen.persoon');
    const persoon = parentModel.persoon;

    const mandataris = await this.getMandataris(params.mandataris_id);
    const mandaat = await mandataris.bekleedt;
    const mandatarissen = await this.getMandatarissen(persoon, mandaat);

    const mandatarisEditForm = getFormFrom(this.store, MANDATARIS_EDIT_FORM_ID);
    const mandatarisExtraInfoForm = getFormFrom(
      this.store,
      MANDATARIS_EXTRA_INFO_FORM_ID
    );

    const bestuursorganen = await (await mandataris.bekleedt).get('bevatIn');
    const selectedBestuursperiode = (await bestuursorganen)[0]
      .heeftBestuursperiode;
    const isDistrict = this.currentSession.isDistrict;

    return RSVP.hash({
      bestuurseenheid,
      mandataris,
      mandatarissen,
      mandatarisEditForm,
      mandatarisExtraInfoForm,
      bestuursorganen,
      selectedBestuursperiode,
      isDistrictEenheid: isDistrict,
    });
  }

  async getMandataris(id) {
    let queryParams = {
      include: [
        'bekleedt.bestuursfunctie',
        'bekleedt.bevat-in',
        'beleidsdomein',
        'status',
        'publication-status',
        'tijdelijke-vervangingen',
        'heeft-lidmaatschap.binnen-fractie',
      ].join(','),
    };

    let mandataris = await this.store.findRecord('mandataris', id, queryParams);
    return mandataris;
  }

  async getMandatarissen(persoon, mandaat) {
    let queryParams = {
      sort: '-start',
      filter: {
        'is-bestuurlijke-alias-van': {
          id: persoon.id,
        },
        bekleedt: {
          id: mandaat.id,
        },
      },
      include: [
        'is-bestuurlijke-alias-van',
        'bekleedt.bestuursfunctie',
        'beleidsdomein',
        'heeft-lidmaatschap.binnen-fractie',
      ].join(','),
    };

    return await this.store.query('mandataris', queryParams);
  }
}
