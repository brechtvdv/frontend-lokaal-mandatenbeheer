import Model, { attr, belongsTo } from '@ember-data/model';

export default class RechtsgrondModel extends Model {
  @attr uri;
  @attr gepubliceerdVanuit;

  @belongsTo('mandataris', {
    async: true,
    inverse: 'aanstellingBekrachtigdDoor',
  })
  bekrachtigtAanstellingVan;

  @belongsTo('mandataris', {
    async: true,
    inverse: 'ontslagBekrachtigdDoor',
  })
  bekrachtigtOntslagVan;
}
