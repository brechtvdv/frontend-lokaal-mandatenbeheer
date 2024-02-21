import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';
import {
  getBestuursPeriodsOG,
  getSelectedBestuursorgaanWithPeriods,
} from 'frontend-lmb/utils/bestuursperioden';
import { getFormFrom } from 'frontend-lmb/utils/get-form';
import { BESTUURSORGAAN_FORM_ID } from 'frontend-lmb/utils/well-known-ids';
import RSVP from 'rsvp';

export default class OrganenOrgaanRoute extends Route {
  @service store;

  queryParams = {
    startDate: { refreshModel: true },
    endDate: { refreshModel: true },
  };

  async model(params) {
    const bestuursorgaanId = params.orgaan_id;

    const bestuursorgaan = await this.store.findRecord(
      'bestuursorgaan',
      bestuursorgaanId,
      {
        include: 'classificatie,heeft-tijdsspecialisaties',
      }
    );

    const tijdsspecialisaties = await bestuursorgaan.heeftTijdsspecialisaties;
    const { bestuursOrgaan, startDate, endDate } =
      getSelectedBestuursorgaanWithPeriods(tijdsspecialisaties, {
        startDate: params.startDate,
        endDate: params.endDate,
      });

    const bestuursPeriods = getBestuursPeriodsOG(tijdsspecialisaties);
    const selectedPeriod = { startDate, endDate };

    const formDefinition = getFormFrom(this.store, BESTUURSORGAAN_FORM_ID);

    return RSVP.hash({
      form: formDefinition,
      instanceId: bestuursorgaanId,
      bestuursorgaan,
      bestuursPeriods,
      selectedPeriod,
      currentBestuursOrgaan: bestuursOrgaan,
    });
  }
}
