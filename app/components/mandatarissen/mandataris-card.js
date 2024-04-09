import Component from '@glimmer/component';

export default class MandatarisCardComponent extends Component {
  get bestuursOrgaanLabel() {
    return this.args.mandataris
      .get('bekleedt.bevatIn')
      .then(async (bestuursOrganenInDeTijd) => {
        const bestuursOrgaan = await bestuursOrganenInDeTijd?.[0]?.get(
          'isTijdsspecialisatieVan'
        );

        return bestuursOrgaan ? `- ${bestuursOrgaan.naam}` : '';
      });
  }

  get rol() {
    return this.args.mandataris.bekleedt.get('bestuursfunctie').get('label');
  }
  get status() {
    return this.args.mandataris.status.get('label');
  }
  get fractie() {
    return this.args.mandataris.heeftLidmaatschap.get('binnenFractie')
      ? this.args.mandataris.heeftLidmaatschap.get('binnenFractie').get('naam')
      : '';
  }

  get formattedBeleidsdomein() {
    const beleidsdomeinenPromise = this.args.mandataris.beleidsdomein;
    if (!beleidsdomeinenPromise.length) {
      return [];
    }
    return beleidsdomeinenPromise.then((beleidsdomeinen) => {
      return beleidsdomeinen.map((item) => item.label).join(', ');
    });
  }
}
