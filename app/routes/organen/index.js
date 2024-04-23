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
    sort: { refreshModel: true },
    activeFilter: { refreshModel: true },
    selectedTypes: { refreshModel: true },
  };

  async model(params) {
    const parentModel = this.modelFor('organen');
    const queryOptions = this.getOptions(parentModel.bestuurseenheid, params);
    let bestuursorganen = await this.store.query(
      'bestuursorgaan',
      queryOptions
    );
    if (params.activeFilter) {
      bestuursorganen = bestuursorganen.filter((orgaan) => {
        return orgaan.isActive;
      });
    }
    const tmp2 = await Promise.all(
      bestuursorganen.map(async (orgaan) => {
        const tmp = await Promise.all(
          params.selectedTypes.map(async (filter) => {
            return await orgaan.get(filter);
          })
        );
        const some = tmp.some((val) => {
          return val;
        });
        return { bool: some, orgaan };
      })
    );
    bestuursorganen = tmp2.filter((val) => val.bool).map((val) => val.orgaan);
    const form = await getFormFrom(this.store, BESTUURSORGAAN_FORM_ID);

    return {
      bestuurseenheid: parentModel.bestuurseenheid,
      bestuursorganen,
      form,
    };
  }

  getOptions(bestuurseenheid, params) {
    const queryParams = {
      sort: params.sort,
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
