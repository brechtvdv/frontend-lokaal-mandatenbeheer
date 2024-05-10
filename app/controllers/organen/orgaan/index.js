import Controller from '@ember/controller';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';
import { inject as service } from '@ember/service';

export default class OrganenOrgaanIndexController extends Controller {
  @service router;
  @tracked isModalActive = false;

  @action
  toggleModal() {
    this.isModalActive = !this.isModalActive;
  }

  @action
  onSave() {
    this.isModalActive = !this.isModalActive;
    setTimeout(() => this.router.refresh(), 1000);
  }
}
