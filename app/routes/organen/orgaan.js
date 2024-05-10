import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';
import { queryRecord } from 'frontend-lmb/utils/query-record';
import RSVP from 'rsvp';

export default class OrganenOrgaanRoute extends Route {
  @service store;
  @service bestuursperioden;

  queryParams = {
    bestuursperiode: { refreshModel: true },
  };

  async model(params) {
    const bestuursorgaanId = params.id;

    const bestuursorgaan = await this.store.findRecord(
      'bestuursorgaan',
      bestuursorgaanId,
      {
        include: 'classificatie,heeft-tijdsspecialisaties',
      }
    );

    const bestuursPeriods = await this.store.query('bestuursperiode', {
      sort: 'label',
      'filter[heeft-bestuursorganen-in-tijd][is-tijdsspecialisatie-van][:id:]':
        bestuursorgaanId,
    });
    let selectedPeriod = this.bestuursperioden.getRelevantPeriod(
      bestuursPeriods,
      params.bestuursperiode
    );

    const currentBestuursorgaan = await queryRecord(
      this.store,
      'bestuursorgaan',
      {
        'filter[is-tijdsspecialisatie-van][:id:]': bestuursorgaanId,
        'filter[heeft-bestuursperiode][:id:]': selectedPeriod.id,
      }
    );

    return RSVP.hash({
      bestuursorgaan,
      bestuursPeriods,
      selectedPeriod,
      currentBestuursorgaan,
    });
  }
}
