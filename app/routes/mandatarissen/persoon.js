import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';
import RSVP from 'rsvp';

export default class MandatarissenPersoonRoute extends Route {
  @service store;
  @service bestuursorganen;

  async model(params) {
    const persoon = await this.store.findRecord('persoon', params.id);
    const mandatarissen = await this.getMandatarissen(persoon);

    const actieveMandatarissen = [];
    const inactieveMandatarissen = [];
    await Promise.all(
      mandatarissen.map((mandataris) => {
        const active = mandataris.isActive;
        if (active) {
          actieveMandatarissen.push(mandataris);
        } else {
          inactieveMandatarissen.push(mandataris);
        }
      })
    );

    const bestuursorganen =
      await this.bestuursorganen.getAllRealPoliticalBestuursorganen();

    return RSVP.hash({
      persoon,
      actieveMandatarissen,
      inactieveMandatarissen,
      bestuursorganen,
    });
  }

  async getMandatarissen(persoon) {
    let queryParams = {
      filter: {
        'is-bestuurlijke-alias-van': {
          id: persoon.id,
        },
      },
      include: [
        'is-bestuurlijke-alias-van',
        'bekleedt.bestuursfunctie',
        'beleidsdomein',
        'heeft-lidmaatschap.binnen-fractie',
      ].join(','),
    };

    let mandatarissen = await this.store.query('mandataris', queryParams);
    return this.keepLatestMandatarisPerMandaat(mandatarissen);
  }

  keepLatestMandatarisPerMandaat(mandatarissen) {
    const mandaatIdToMandataris = {};

    mandatarissen.forEach((mandataris) => {
      const mandaatId = mandataris.bekleedt.id;
      if (!mandaatIdToMandataris[mandaatId]) {
        mandaatIdToMandataris[mandaatId] = mandataris;
      } else {
        const existingMandataris = mandaatIdToMandataris[mandaatId];
        if (mandataris.start > existingMandataris.start) {
          mandaatIdToMandataris[mandaatId] = mandataris;
        }
      }
    });

    return Object.values(mandaatIdToMandataris);
  }
}
