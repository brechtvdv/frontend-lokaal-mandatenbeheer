import Route from '@ember/routing/route';
import DataTableRouteMixin from 'ember-data-table/mixins/route';
import AuthenticatedRouteMixin from 'ember-simple-auth/mixins/authenticated-route-mixin';

export default Route.extend(AuthenticatedRouteMixin, DataTableRouteMixin, {
  modelName: 'mandataris',

  async beforeModel(){
    let mandatenbeheer = await this.modelFor('mandatenbeheer');
    this.set('bestuurseenheid', mandatenbeheer.bestuurseenheid);
    let bestuursorganen = mandatenbeheer.bestuursorganen;
    this.set('bestuursorganen', bestuursorganen);
    this.set('bestuursorganenIds', bestuursorganen.map(o => o.get('id')));
  },

  mergeQueryOptions(params){
    let queryParams = {
      sort: params.sort,
      filter: {
        'bekleedt': {
          'bevat-in': {
            'id': this.get('bestuursorganenIds').join(',')
          }
        }
      },
      include: [
        'is-bestuurlijke-alias-van',
        'is-bestuurlijke-alias-van.is-kandidaat-voor',
        'bekleedt',
        'bekleedt.bestuursfunctie',
        'bekleedt.bevat-in.is-tijdsspecialisatie-van',
        'bekleedt.bevat-in.is-tijdsspecialisatie-van.classificatie',
        'heeft-lidmaatschap',
        'heeft-lidmaatschap.binnen-fractie',
        'beleidsdomein'
      ].join(',')
    };

    if(params.filter){
      queryParams['filter']['is-bestuurlijke-alias-van'] = params.filter;
    }

    return queryParams;
  },

  async setupController(controller, model){
    this._super(controller, model);
    controller.set('searchData', this.paramsFor('mandatenbeheer.mandatarissen')['filter']);
    controller.set('bestuurseenheid', this.get('bestuurseenheid'));
    controller.set('bestuursorganen', this.get('bestuursorganen'));
  }
});
