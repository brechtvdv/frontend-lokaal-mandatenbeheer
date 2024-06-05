import Component from '@glimmer/component';

import { task } from 'ember-concurrency';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';
import { service } from '@ember/service';

import { showErrorToast, showSuccessToast } from 'frontend-lmb/utils/toasts';
import { VERHINDERD_STATE_ID } from 'frontend-lmb/utils/well-known-ids';
import { getDraftPublicationStatus } from 'frontend-lmb/utils/get-mandataris-status';
import { burgemeesterOnlyStates } from 'frontend-lmb/utils/well-known-uris';

export default class MandatarissenUpdateState extends Component {
  @tracked newStatus = null;
  @tracked date = null;
  @tracked selectedFractie = null;
  @tracked bestuurseenheid = null;
  @tracked bestuursorganenOfMandaat = [];
  @tracked bestuursperiode;
  @tracked rangorde = null;
  @tracked selectedReplacement = null;
  @tracked replacementUpdated;
  @tracked statusOptions = [];

  @service mandatarisStatus;
  @service currentSession;
  @service store;
  @service toaster;
  @service('mandataris') mandatarisService;

  constructor() {
    super(...arguments);
    this.bestuurseenheid = this.currentSession.group;
    this.load.perform();
  }

  get loading() {
    return this.load.isRunning;
  }

  load = task({ drop: true }, async () => {
    this.newStatus = this.args.mandataris.status;
    this.date = new Date();
    this.rangorde = this.args.mandataris.rangorde;
    this.selectedFractie = await (
      await this.args.mandataris.heeftLidmaatschap
    )?.binnenFractie;
    this.bestuursorganenOfMandaat = (
      await (
        await this.args.mandataris.bekleedt
      ).bevatIn
    ).slice();
    this.bestuursperiode =
      await this.bestuursorganenOfMandaat[0]?.heeftBestuursperiode;
    this.statusOptions = await this.getStatusOptions();
  });

  async getStatusOptions() {
    const isBurgemeester = (
      await (
        await this.args.mandataris.bekleedt
      ).bestuursfunctie
    ).isBurgemeester;

    // Slice to get rid of proxy
    const statuses = this.mandatarisStatus.statuses.slice();

    if (isBurgemeester) {
      return statuses;
    }
    return statuses.filter(
      (status) => !burgemeesterOnlyStates.includes(status.uri)
    );
  }

  get currentStatus() {
    if (!this.args.mandataris.einde) {
      return this.args.mandataris.status;
    }
    if (this.args.mandataris.einde.getTime() < new Date().getTime()) {
      return this.mandatarisStatus.endedState;
    }
    return this.args.mandataris.status;
  }

  get showReplacement() {
    return (
      this.newStatus?.id === VERHINDERD_STATE_ID &&
      // if we are already verhinderd it does not make sense to change the replacements here, keep them  the same and don't show the selector
      this.args.mandataris.status?.id !== VERHINDERD_STATE_ID
    );
  }

  get isTerminatingMandate() {
    return this.newStatus === this.mandatarisStatus.endedState;
  }

  get validDate() {
    if (!this.date) {
      return false;
    }
    if (!this.args.mandataris.start) {
      return true;
    }
    return this.date.getTime() >= this.args.mandataris.start.getTime();
  }

  get hasChanges() {
    return (
      this.newStatus?.id !== this.args.mandataris.status?.id ||
      this.selectedFractie?.id !==
        this.args.mandataris.get('heeftLidmaatschap.binnenFractie.id') ||
      this.rangorde !== this.args.mandataris.rangorde ||
      this.replacementUpdated
    );
  }

  get disabled() {
    return (
      this.loading ||
      !this.newStatus ||
      !this.date ||
      !this.validDate ||
      !this.hasChanges
    );
  }

  get rangordePlaceholder() {
    const mandaatName = (
      this.args.mandataris.get('bekleedt.bestuursfunctie.label') || 'schepen'
    ).toLowerCase();
    return `Eerste ${mandaatName}`;
  }

  async changeMandatarisState() {
    await this.updateOldLidmaatschap();

    const endDate = this.args.mandataris.einde;

    const newMandatarisProps = {
      rangorde: this.rangorde,
      start: this.date,
      einde: endDate,
      bekleedt: this.args.mandataris.bekleedt,
      isBestuurlijkeAliasVan: this.args.mandataris.isBestuurlijkeAliasVan,
      beleidsdomein: (await this.args.mandataris.beleidsdomein).slice(),
      status: this.newStatus,
      publicationStatus: await getDraftPublicationStatus(this.store),
    };

    const newMandataris = this.store.createRecord(
      'mandataris',
      newMandatarisProps
    );

    if (this.selectedReplacement) {
      const replacementMandataris =
        await this.mandatarisService.getOrCreateReplacement(
          this.args.mandataris,
          this.selectedReplacement,
          // passing these along because if we pass the model, relations will be
          // evaluated as of right now and we haven't saved yet
          newMandatarisProps,
          this.selectedFractie
        );
      newMandataris.tijdelijkeVervangingen = [replacementMandataris];
    } else {
      newMandataris.tijdelijkeVervangingen =
        (await this.args.mandataris.tijdelijkeVervangingen) || [];
      newMandataris.vervangerVan =
        (await this.args.mandataris.vervangerVan) || [];
    }

    this.args.mandataris.einde = this.date;
    await Promise.all([newMandataris.save(), this.args.mandataris.save()]);

    await this.mandatarisService.createNewLidmaatschap(
      newMandataris,
      this.selectedFractie
    );

    return newMandataris;
  }

  async updateOldLidmaatschap() {
    const oldLidmaatschap = await this.args.mandataris.heeftLidmaatschap;
    if (!oldLidmaatschap) {
      return;
    }
    let oldTijdsinterval = await oldLidmaatschap.lidGedurende;

    if (!oldTijdsinterval) {
      // old membership instances don't necessarily have a tijdsinterval
      oldTijdsinterval = this.store.createRecord('tijdsinterval', {
        begin: this.args.mandataris.start,
        einde: this.date,
      });
      await oldTijdsinterval.save();
      oldLidmaatschap.lidGedurende = oldTijdsinterval;
      await oldLidmaatschap.save();
    }
    oldTijdsinterval.einde = this.date;

    await oldTijdsinterval.save();
  }

  endMandataris() {
    this.args.mandataris.einde = this.date;

    return this.args.mandataris.save();
  }

  onStateChanged(newMandataris) {
    if (this.args.onStateChanged) {
      this.args.onStateChanged(newMandataris);
    }
  }

  updateState = task({ drop: true }, async () => {
    let promise;
    if (this.newStatus === this.mandatarisStatus.endedState) {
      promise = this.endMandataris();
    } else {
      promise = this.changeMandatarisState();
    }

    await promise
      .then((newMandataris) => {
        showSuccessToast(
          this.toaster,
          'Mandataris status werd succesvol aangepast.'
        );
        this.onStateChanged(newMandataris);
      })
      .catch((e) => {
        console.log(e);
        showErrorToast(
          this.toaster,
          'Er ging iets mis bij het aanpassen van de mandataris status.'
        );
        this.onStateChanged(this.args.mandataris);
      });
  });

  @action
  updateDate(date) {
    this.date = new Date(date);
  }

  @action
  updateNewStatus(status) {
    this.newStatus = status;
  }

  @action
  updateRangorde(event) {
    if (event && typeof event.preventDefault === 'function') {
      event.preventDefault();
    }
    this.rangorde = event.target.value;
  }

  @action updateFractie(newFractie) {
    this.selectedFractie = newFractie;
  }

  @action updateReplacement(newReplacement) {
    this.selectedReplacement = newReplacement;
    this.replacementUpdated = true;
  }
}
