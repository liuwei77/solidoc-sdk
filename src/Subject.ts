import { Predicate } from './Predicate';
import { Object, Literal } from './Object';
import * as _ from 'lodash';
import { ont, defaultJson } from '../config/ontology';

class Subject {
  private _id: string;
  private _type: string;
  private _graph: string;
  private _isDeleted: boolean = false;
  private _isInserted: boolean = false;

  private _valuesUpdated = new Map<Predicate, Object>();
  private _valuesFromPod = new Map<Predicate, Object>();

  constructor(id: string, graph: string) {
    this._id = id;
    this._graph = graph;
  }

  public get id(): string {
    return this._id;
  }

  public get type(): string {
    return this._type;
  }

  public fromQuad(pred: Predicate, obj: any) {
    const result = Object.fromQuad(obj);

    this._valuesFromPod.set(pred, { ...result });
    this._valuesUpdated.set(pred, { ...result });

    // TODO: use label
    pred.id === ont.rdf.type && (this._type = <string>result.value);
  }

  public getProperty(pred: Predicate): Literal {
    const obj: Object = this._valuesUpdated.get(pred) || pred.default;
    return obj.value;
  }

  public setProperty(pred: Predicate, value: Literal) {
    const obj = Object.fromValue(pred.range, value);
    this._valuesUpdated.set(pred, obj);
    // _.isEqual(obj, pred.default) && this._valuesUpdated.delete(pred);

    // TODO: use label
    pred.id === ont.rdf.type && (this._type = <string>value);
  }

  public toJson() {
    const result = defaultJson(this.id, this.type);

    for (let pred of this._valuesUpdated.keys()) {
      [ont.sdoc.next, ont.sdoc.firstChild, ont.rdf.type].includes(pred.id) ||
        (result[pred.label] = this.getProperty(pred));
    }

    return result;
  }

  public getSparqlForUpdate = (): string => {
    if (this._isDeleted) {
      // TODO: for non-persisted subjects, this clause should be empty
      return `DELETE WHERE { GRAPH <${this._graph}> { <${this._id}> ?p ?o } };\n`;
    } else {
      let sparql = '';
      let allPred = new Set<Predicate>([
        ...this._valuesFromPod.keys(),
        ...this._valuesUpdated.keys(),
      ]);
      for (let pred of allPred) {
        sparql += pred.getSparql(
          this._id,
          this._valuesUpdated.get(pred) || pred.default,
          this._valuesFromPod.get(pred) || pred.default,
        );
      }
      return sparql;
    }
  };

  public commit = () => {
    if (this._isDeleted) {
      throw new Error('A deleted subject should not be committed');
    }

    this._valuesFromPod = _.cloneDeep(this._valuesUpdated);

    this._isInserted = false;
  };

  public undo() {
    if (this._isInserted) {
      throw new Error('A non-persisted subject should not be undone');
    }

    this._valuesUpdated = _.cloneDeep(this._valuesFromPod);

    this._isDeleted = false;
  }

  public delete() {
    if (this._id === this._graph) {
      throw new Error('The root is not removable :' + this._id);
    }
    this._isDeleted = true;
  }

  public isDeleted = (): boolean => {
    return this._isDeleted;
  };

  public isInserted = (): boolean => {
    return this._isInserted;
  };

  public insert = () => {
    this._isInserted = true;
  };
}

export { Subject };
