import Controller from '@ember/controller';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';
import { restartableTask, dropTask, timeout } from 'ember-concurrency';

export default class PublicServicesIndexController extends Controller {
  queryParams = ['search', 'sector', 'sort', 'page'];
  @tracked search = '';
  @tracked sector = '';
  @tracked sort = 'name';
  @tracked page = 0;

  get publicServices() {
    if (this.model.loadPublicServices.isFinished) {
      return this.model.loadPublicServices.value;
    }

    return this.model.loadedPublicServices || [];
  }

  get isFiltering() {
    return Boolean(this.search) || Boolean(this.sector);
  }

  get isLoading() {
    return this.model.loadPublicServices.isRunning;
  }

  get hasPreviousData() {
    return this.model.loadedPublicServices?.length > 0;
  }

  get showTableLoader() {
    // TODO: Add a different loading state when the table already contains data
    // At the moment the table is cleared and the loading animation is shown.
    // It would be better to keep showing the already loaded data with a spinner overlay.
    // return this.isLoading && !this.hasPreviousData;

    return this.isLoading;
  }

  get hasResults() {
    return this.publicServices.length > 0;
  }

  get hasErrored() {
    return this.model.loadPublicServices.isError;
  }
  
  @dropTask
  *addNewProduct() {
    let publicService = this.store.createRecord('public-service');
    yield publicService.save();
    this.router.transitionTo('public-services.details', publicService.id);
  }

  @restartableTask
  *searchTask(searchValue) {
    yield timeout(500);

    this.search = searchValue;
    this.page = 0;
  }

  @action
  handleSectorSelection(sector) {
    this.sector = sector?.id || '';
  }
}
