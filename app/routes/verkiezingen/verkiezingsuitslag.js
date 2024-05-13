import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';
import { action } from '@ember/object';

export default class VerkiezingenVerkiezingsuitslagRoute extends Route {
  @service store;

  queryParams = {
    filter: { refreshModel: true },
    page: { refreshModel: true },
    size: { refreshModel: true },
    sort: { refreshModel: true },
  };

  async model(params) {
    const ivStatuses = await this.store.findAll(
      'installatievergadering-status'
    );
    // Should only be one.
    // TODO add bestuursperiod selector
    const installatievergaderingen = await this.store.query(
      'installatievergadering',
      {
        include: 'status',
      }
    );
    const installatievergadering = installatievergaderingen[0];
    const selectedStatus = installatievergadering.get('status');

    const options = this.getOptions(params);
    const verkiezingsresultaten = await this.store.query(
      'verkiezingsresultaat',
      options
    );

    return {
      ivStatuses,
      selectedStatus,
      installatievergadering,
      verkiezingsresultaten,
    };
  }

  getOptions(params) {
    const options = {
      sort: params.sort,
      page: {
        number: params.page,
        size: params.size,
      },
      'filter[kandidatenlijst][verkiezing][bestuursorgaan-in-tijd][id]':
        params.bestuursorgaan_in_tijd_id,
      'filter[:has:persoon]': 'true',
      include: ['kandidatenlijst', 'persoon'].join(','),
    };
    if (params.filter && params.filter.length > 0) {
      options['filter[persoon]'] = params.filter;
    }
    return options;
  }

  setupController(controller) {
    super.setupController(...arguments);
    controller.searchData = this.paramsFor('verkiezingen.verkiezingsuitslag')[
      'filter'
    ];
  }

  @action
  reloadModel() {
    this.refresh();
  }
}
