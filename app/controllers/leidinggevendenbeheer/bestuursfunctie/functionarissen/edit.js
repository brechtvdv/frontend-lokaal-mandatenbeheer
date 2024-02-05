import Controller from '@ember/controller';
import { task } from 'ember-concurrency';
import { tracked } from '@glimmer/tracking';
import { inject as service } from '@ember/service';

export default class LeidinggevendenbeheerBestuursfunctieFunctionarissenEditController extends Controller {
  @service router;

  @tracked initialStatus;

  get statusIsDirty() {
    return this.initialStatus.get('id') != this.model.status.get('id');
  }

  get isDirty() {
    return this.model.hasDirtyAttributes || this.statusIsDirty;
  }

  @task
  *resetChanges() {
    if (this.isDirty) {
      this.model.rollbackAttributes();
      const status = yield this.initialStatus;
      this.model.set('status', status);
    }
    this.exit();
  }

  exit() {
    this.router.transitionTo(
      'leidinggevendenbeheer.bestuursfunctie.functionarissen'
    );
  }
}
