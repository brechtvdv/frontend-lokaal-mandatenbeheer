import Controller from '@ember/controller';

import { service } from '@ember/service';

export default class LeidinggevendenIndexController extends Controller {
  @service router;

  page = 0;
  size = 20;
}
