import Route from '@ember/routing/route';

import { action } from '@ember/object';
import { service } from '@ember/service';

export default class MandatarissenSearchRoute extends Route {
  @service store;
  @service bestuursperioden;

  queryParams = {
    filter: { refreshModel: true },
    sort: { refreshModel: true },
    bestuursperiode: { refreshModel: true },
    bestuursfunctie: { refreshModel: true },
    binnenFractie: { refreshModel: true },
  };

  async model(params) {
    const bestuursPeriods = await this.store.query('bestuursperiode', {
      sort: 'label',
    });
    let selectedPeriod = this.bestuursperioden.getRelevantPeriod(
      bestuursPeriods,
      params.bestuursperiode
    );

    const personen = await this.getPersonen(params, selectedPeriod);

    const allBestuurfunctieCodes = [];
    const mandatenVoorPeriode = await this.store.query('mandaat', {
      'filter[bevat-in][heeft-bestuursperiode][:id:]': selectedPeriod.id,
      include: ['bevat-in', 'bevat-in.heeft-bestuursperiode'].join(','),
    });
    for (const mandaat of mandatenVoorPeriode) {
      allBestuurfunctieCodes.push(await mandaat.bestuursfunctie);
    }

    const fracties = await this.store.query('fractie', {
      'filter[bestuursorganen-in-tijd][heeft-bestuursperiode][:id:]':
        selectedPeriod.id,
      include: [
        'bestuursorganen-in-tijd',
        'bestuursorganen-in-tijd.heeft-bestuursperiode',
      ].join(','),
    });

    return {
      personen,
      bestuursPeriods,
      selectedPeriod,
      bestuursfuncties: [...new Set(allBestuurfunctieCodes)],
      selectedBestuurfunctieIds: params.bestuursfunctie,
      fracties,
      selectedFracties: params.binnenFractie,
    };
  }

  async getPersonen(params, bestuursperiode) {
    const queryParams = {
      // sort: params.sort,
      page: {
        number: 0,
        size: 1000,
      },
      'filter[bekleedt][bevat-in][heeft-bestuursperiode][:id:]':
        bestuursperiode.id,
      include: [
        'is-bestuurlijke-alias-van',
        'bekleedt',
        'bekleedt.bestuursfunctie',
        'bekleedt.bevat-in.heeft-bestuursperiode',
        'heeft-lidmaatschap',
        'heeft-lidmaatschap.binnen-fractie',
      ].join(','),
    };

    if (params.filter && params.filter.length > 0) {
      queryParams['filter[is-bestuurlijke-alias-van]'] = params.filter;
    }
    if (params.bestuursfunctie) {
      queryParams['filter[bekleedt][bestuursfunctie][:id:]'] =
        params.bestuursfunctie;
    }
    if (params.binnenFractie) {
      queryParams['filter[heeft-lidmaatschap][binnen-fractie][:id:]'] =
        params.binnenFractie;
    }

    const mandatarissen = await this.store.query('mandataris', queryParams);
    // TODO compact these.
    const personen = await Promise.all(
      mandatarissen.map(async (mandataris) => {
        return await mandataris.get('isBestuurlijkeAliasVan');
      })
    );
    return personen;
  }

  setupController(controller) {
    super.setupController(...arguments);
    controller.searchData = this.paramsFor('mandatarissen.search')['filter'];
  }

  @action
  reloadModel() {
    this.refresh();
  }
}
