import { Namespace } from 'rdflib';

export { MU, FORM, RDF, XSD, SKOS } from '@lblod/submission-form-helpers';

export const EXT = new Namespace('http://mu.semte.ch/vocabularies/ext/');
export const ORG = new Namespace('http://www.w3.org/ns/org#');
export const MANDAAT = new Namespace('http://data.vlaanderen.be/ns/mandaat#');
export const LMB = new Namespace('http://lblod.data.gift/vocabularies/lmb/');

export const FIELD_OPTION = new Namespace(
  'http://lblod.data.gift/vocabularies/form-field-options/'
);
