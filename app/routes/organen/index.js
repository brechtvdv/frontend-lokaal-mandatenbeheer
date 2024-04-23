import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';
import { action } from '@ember/object';
import { getFormFrom } from 'frontend-lmb/utils/get-form';
import { BESTUURSORGAAN_FORM_ID } from 'frontend-lmb/utils/well-known-ids';

export default class OrganenIndexRoute extends Route {
  @service store;
  @service decretaleOrganen;

  // can't use pagination as we are filtering frontend side on optional properties, which seems to have limited support
  pageSize = 20000;
  queryParams = {
    orgaanSort: { refreshModel: true },
  };

  async model(params) {
    const parentModel = this.modelFor('organen');
    const queryOptions = this.getOptions(parentModel.bestuurseenheid, params);
    const bestuursorganen = await this.store.query(
      'bestuursorgaan',
      queryOptions
    );
    const form = await getFormFrom(this.store, BESTUURSORGAAN_FORM_ID);

    return {
      bestuurseenheid: parentModel.bestuurseenheid,
      bestuursorganen,
      form,
    };
  }

  getOptions(bestuurseenheid, params) {
    const queryParams = {
      sort: params.orgaanSort,
      page: {
        size: this.pageSize,
      },
      filter: {
        bestuurseenheid: {
          id: bestuurseenheid.id,
        },
        ':has-no:is-tijdsspecialisatie-van': true,
        classificatie: {
          id: this.decretaleOrganen.classificatieIds.join(','),
        },
      },
      include: 'classificatie,heeft-tijdsspecialisaties',
    };
    return queryParams;
  }

  @action
  reloadModel() {
    this.refresh();
  }
}
